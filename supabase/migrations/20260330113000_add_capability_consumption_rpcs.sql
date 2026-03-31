create unique index if not exists user_capability_usage_counters_period_unique
  on public.user_capability_usage_counters (
    user_id,
    capability_type,
    metric_key,
    coalesce(model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid),
    usage_period_start,
    usage_period_end
  );

create or replace function public.consume_capability_units(
  p_user_id uuid,
  p_capability_type text,
  p_metric_key text,
  p_model_capability_id uuid,
  p_usage_units integer,
  p_included_units integer,
  p_usage_period_start timestamptz,
  p_usage_period_end timestamptz,
  p_credits_cost_per_unit integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counter public.user_capability_usage_counters%rowtype;
  v_wallet public.user_credit_wallets%rowtype;
  v_allowance_remaining integer := 0;
  v_allowance_consumed integer := 0;
  v_paid_units integer := 0;
  v_debit_amount integer := 0;
  v_balance_after integer := 0;
begin
  if p_usage_units is null or p_usage_units <= 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_usage_units'
    );
  end if;

  if p_capability_type not in ('text', 'image', 'audio', 'video') then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_capability_type'
    );
  end if;

  if p_usage_period_end <= p_usage_period_start then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_usage_period'
    );
  end if;

  insert into public.user_credit_wallets (
    user_id,
    balance,
    lifetime_credited,
    lifetime_debited,
    metadata
  )
  values (
    p_user_id,
    0,
    0,
    0,
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  insert into public.user_capability_usage_counters (
    user_id,
    capability_type,
    metric_key,
    model_capability_id,
    usage_period_start,
    usage_period_end,
    used_units,
    metadata
  )
  values (
    p_user_id,
    p_capability_type,
    p_metric_key,
    p_model_capability_id,
    p_usage_period_start,
    p_usage_period_end,
    0,
    '{}'::jsonb
  )
  on conflict do nothing;

  select *
  into v_counter
  from public.user_capability_usage_counters
  where user_id = p_user_id
    and capability_type = p_capability_type
    and metric_key = p_metric_key
    and coalesce(model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid) =
      coalesce(p_model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and usage_period_start = p_usage_period_start
    and usage_period_end = p_usage_period_end
  for update;

  if p_included_units is not null and p_included_units > 0 then
    v_allowance_remaining := greatest(p_included_units - coalesce(v_counter.used_units, 0), 0);
    v_allowance_consumed := least(p_usage_units, v_allowance_remaining);
  end if;

  v_paid_units := greatest(p_usage_units - v_allowance_consumed, 0);

  select *
  into v_wallet
  from public.user_credit_wallets
  where user_id = p_user_id
  for update;

  if v_paid_units > 0 then
    if p_credits_cost_per_unit is null or p_credits_cost_per_unit <= 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'credits_not_configured',
        'allowance_consumed', v_allowance_consumed,
        'paid_units', v_paid_units,
        'balance_after', v_wallet.balance
      );
    end if;

    v_debit_amount := v_paid_units * p_credits_cost_per_unit;

    if v_wallet.balance < v_debit_amount then
      return jsonb_build_object(
        'ok', false,
        'code', 'insufficient_credits',
        'allowance_consumed', v_allowance_consumed,
        'paid_units', v_paid_units,
        'required_credits', v_debit_amount,
        'balance_after', v_wallet.balance
      );
    end if;
  end if;

  update public.user_capability_usage_counters
  set
    used_units = coalesce(v_counter.used_units, 0) + v_allowance_consumed,
    metadata = coalesce(public.user_capability_usage_counters.metadata, '{}'::jsonb) || jsonb_build_object(
      'last_consumed_at', timezone('utc', now()),
      'last_reason', p_reason
    ),
    updated_at = timezone('utc', now())
  where id = v_counter.id;

  if v_debit_amount > 0 then
    v_balance_after := v_wallet.balance - v_debit_amount;

    update public.user_credit_wallets
    set
      balance = v_balance_after,
      lifetime_debited = coalesce(public.user_credit_wallets.lifetime_debited, 0) + v_debit_amount,
      metadata = coalesce(public.user_credit_wallets.metadata, '{}'::jsonb) || jsonb_build_object(
        'last_debit_reason', p_reason,
        'last_debit_at', timezone('utc', now())
      ),
      updated_at = timezone('utc', now())
    where user_id = p_user_id;

    insert into public.user_credit_ledger (
      user_id,
      direction,
      amount,
      balance_after,
      reason,
      capability_type,
      model_capability_id,
      metadata
    )
    values (
      p_user_id,
      'debit',
      v_debit_amount,
      v_balance_after,
      p_reason,
      p_capability_type,
      p_model_capability_id,
      coalesce(p_metadata, '{}'::jsonb)
    );
  else
    v_balance_after := v_wallet.balance;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', case when v_debit_amount > 0 then 'credits_debited' else 'allowance_used' end,
    'allowance_consumed', v_allowance_consumed,
    'paid_units', v_paid_units,
    'debited_credits', v_debit_amount,
    'balance_after', v_balance_after,
    'usage_after', coalesce(v_counter.used_units, 0) + v_allowance_consumed,
    'included_units', p_included_units,
    'usage_period_start', p_usage_period_start,
    'usage_period_end', p_usage_period_end
  );
end;
$$;

create or replace function public.refund_capability_credits(
  p_user_id uuid,
  p_amount integer,
  p_capability_type text,
  p_model_capability_id uuid,
  p_reason text,
  p_metric_key text default null,
  p_allowance_units integer default 0,
  p_usage_period_start timestamptz default null,
  p_usage_period_end timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_credit_wallets%rowtype;
  v_counter public.user_capability_usage_counters%rowtype;
  v_balance_after integer := 0;
begin
  if coalesce(p_amount, 0) <= 0 and coalesce(p_allowance_units, 0) <= 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_refund_amount'
    );
  end if;

  insert into public.user_credit_wallets (
    user_id,
    balance,
    lifetime_credited,
    lifetime_debited,
    metadata
  )
  values (
    p_user_id,
    0,
    0,
    0,
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  select *
  into v_wallet
  from public.user_credit_wallets
  where user_id = p_user_id
  for update;

  if coalesce(p_amount, 0) > 0 then
    v_balance_after := v_wallet.balance + p_amount;

    update public.user_credit_wallets
    set
      balance = v_balance_after,
      metadata = coalesce(public.user_credit_wallets.metadata, '{}'::jsonb) || jsonb_build_object(
        'last_refund_reason', p_reason,
        'last_refund_at', timezone('utc', now())
      ),
      updated_at = timezone('utc', now())
    where user_id = p_user_id;

    insert into public.user_credit_ledger (
      user_id,
      direction,
      amount,
      balance_after,
      reason,
      capability_type,
      model_capability_id,
      metadata
    )
    values (
      p_user_id,
      'credit',
      p_amount,
      v_balance_after,
      p_reason,
      p_capability_type,
      p_model_capability_id,
      coalesce(p_metadata, '{}'::jsonb)
    );
  else
    v_balance_after := v_wallet.balance;
  end if;

  if coalesce(p_allowance_units, 0) > 0
    and p_metric_key is not null
    and p_usage_period_start is not null
    and p_usage_period_end is not null then
    select *
    into v_counter
    from public.user_capability_usage_counters
    where user_id = p_user_id
      and capability_type = p_capability_type
      and metric_key = p_metric_key
      and coalesce(model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid) =
        coalesce(p_model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and usage_period_start = p_usage_period_start
      and usage_period_end = p_usage_period_end
    for update;

    if found then
      update public.user_capability_usage_counters
      set
        used_units = greatest(coalesce(v_counter.used_units, 0) - p_allowance_units, 0),
        metadata = coalesce(public.user_capability_usage_counters.metadata, '{}'::jsonb) || jsonb_build_object(
          'last_refund_reason', p_reason,
          'last_refund_at', timezone('utc', now())
        ),
        updated_at = timezone('utc', now())
      where id = v_counter.id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'refunded',
    'balance_after', v_balance_after,
    'credited_amount', p_amount
  );
end;
$$;
