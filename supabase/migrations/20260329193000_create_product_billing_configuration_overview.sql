create or replace function public.get_product_billing_configuration()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with plan_rows as (
  select
    plans.id,
    plans.slug,
    plans.name,
    plans.description,
    plans.status,
    plans.billing_interval,
    plans.is_default,
    plans.metadata,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'model_slug', model_capabilities.slug,
            'capability_type', model_capabilities.capability_type,
            'display_name', model_capabilities.display_name,
            'provider', model_capabilities.provider,
            'model_key', model_capabilities.model_key,
            'quality_tier', model_capabilities.quality_tier,
            'availability_status', model_capabilities.availability_status,
            'access_level', access_rules.access_level,
            'is_default', access_rules.is_default,
            'metadata', access_rules.metadata
          )
          order by
            model_capabilities.capability_type,
            access_rules.is_default desc,
            model_capabilities.display_name
        )
        from public.product_plan_model_access access_rules
        join public.product_model_capabilities model_capabilities
          on model_capabilities.id = access_rules.model_capability_id
        where access_rules.plan_id = plans.id
      ),
      '[]'::jsonb
    ) as model_access,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'capability_type', entitlements.capability_type,
            'entitlement_key', entitlements.entitlement_key,
            'model_slug', model_capabilities.slug,
            'included_units', entitlements.included_units,
            'reset_interval', entitlements.reset_interval,
            'overage_mode', entitlements.overage_mode,
            'metadata', entitlements.metadata
          )
          order by
            entitlements.capability_type,
            entitlements.entitlement_key,
            model_capabilities.slug nulls first
        )
        from public.product_plan_entitlements entitlements
        left join public.product_model_capabilities model_capabilities
          on model_capabilities.id = entitlements.model_capability_id
        where entitlements.plan_id = plans.id
      ),
      '[]'::jsonb
    ) as entitlements,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'capability_type', credit_rules.capability_type,
            'billing_unit', credit_rules.billing_unit,
            'credits_cost', credit_rules.credits_cost,
            'model_slug', model_capabilities.slug,
            'is_active', credit_rules.is_active,
            'metadata', credit_rules.metadata
          )
          order by
            credit_rules.capability_type,
            model_capabilities.slug nulls first
        )
        from public.product_credit_price_rules credit_rules
        left join public.product_model_capabilities model_capabilities
          on model_capabilities.id = credit_rules.model_capability_id
        where credit_rules.plan_id = plans.id
      ),
      '[]'::jsonb
    ) as plan_credit_rules
  from public.product_billing_plans plans
  where plans.status = 'active'
),
global_credit_rules as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'capability_type', credit_rules.capability_type,
        'billing_unit', credit_rules.billing_unit,
        'credits_cost', credit_rules.credits_cost,
        'model_slug', model_capabilities.slug,
        'is_active', credit_rules.is_active,
        'metadata', credit_rules.metadata
      )
      order by credit_rules.capability_type, model_capabilities.slug nulls first
    ),
    '[]'::jsonb
  ) as rules
  from public.product_credit_price_rules credit_rules
  left join public.product_model_capabilities model_capabilities
    on model_capabilities.id = credit_rules.model_capability_id
  where credit_rules.plan_id is null
),
model_catalog as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'slug', model_capabilities.slug,
        'capability_type', model_capabilities.capability_type,
        'display_name', model_capabilities.display_name,
        'provider', model_capabilities.provider,
        'model_key', model_capabilities.model_key,
        'quality_tier', model_capabilities.quality_tier,
        'availability_status', model_capabilities.availability_status,
        'metadata', model_capabilities.metadata
      )
      order by
        model_capabilities.capability_type,
        model_capabilities.quality_tier,
        model_capabilities.display_name
    ),
    '[]'::jsonb
  ) as models
  from public.product_model_capabilities model_capabilities
  where model_capabilities.availability_status in ('active', 'preview')
)
select jsonb_build_object(
  'generated_at', timezone('utc', now()),
  'plans',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'slug', plan_rows.slug,
          'name', plan_rows.name,
          'description', plan_rows.description,
          'status', plan_rows.status,
          'billing_interval', plan_rows.billing_interval,
          'is_default', plan_rows.is_default,
          'metadata', plan_rows.metadata,
          'model_access', plan_rows.model_access,
          'entitlements', plan_rows.entitlements,
          'credit_rules', plan_rows.plan_credit_rules
        )
        order by plan_rows.is_default desc, plan_rows.slug
      )
      from plan_rows
    ),
    '[]'::jsonb
  ),
  'model_catalog',
  (select models from model_catalog),
  'global_credit_rules',
  (select rules from global_credit_rules)
);
$$;

create or replace view public.product_billing_configuration_overview
with (security_invoker = true) as
select public.get_product_billing_configuration() as configuration;
