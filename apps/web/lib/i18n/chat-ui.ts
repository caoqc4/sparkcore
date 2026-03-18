export type ChatLocale = "en" | "zh-CN";

export const CHAT_UI_LANGUAGE_COOKIE = "sparkcore_ui_lang";

export function resolveChatLocale(rawValue: string | undefined): ChatLocale {
  return rawValue === "zh-CN" ? "zh-CN" : "en";
}

export function getChatCopy(locale: ChatLocale) {
  if (locale === "zh-CN") {
    return {
      locale,
      languageSwitchLabel: "界面语言",
      languages: { en: "EN", "zh-CN": "中文" },
      states: {
        fetchFailedEyebrow: "加载失败",
        fetchFailedTitle: "聊天数据当前无法加载",
        fetchFailedDescription:
          "这代表聊天数据加载失败，而不是空工作区。刷新后会重试当前聊天视图。",
        threadUnavailableEyebrow: "线程不可用",
        emptyStateEyebrow: "空状态",
        threadUnavailableTitle: "这个线程当前不可用",
        noActiveThreadTitle: "当前还没有活跃线程",
        threadUnavailableDescription:
          "URL 里的线程在当前用户范围内已经不可用。如果还有其他可访问线程，它会显示在侧边栏里。",
        noActiveThreadWithAgent:
          "从侧边栏创建一条线程，把它绑定到一个 agent，然后这里就会打开对应会话。",
        noActiveThreadWithoutAgent:
          "当前还没有活跃线程，这个工作区也还需要一个活跃 agent，聊天才能开始。",
        requestedThreadFallback:
          "请求的线程在你当前工作区里不可用，所以这里展示的是最近一个仍可访问的线程。",
        retryChat: "重试聊天",
        backToWorkspace: "返回工作区",
        noActiveAgentTitle: "暂无可用 agent",
        noActiveAgentDescription:
          "先添加或恢复一个 agent，之后它就会出现在这里并可用于新建线程。",
        noThreadsTitle: "还没有线程",
        noThreadsWithAgent:
          "先在上方选择一个 agent 创建第一条线程。创建后它会出现在这里，并与 URL 保持同步。",
        noThreadsWithoutAgent:
          "先创建或恢复一个 agent，然后再回到这里打开第一条线程。"
      },
      sidebar: {
        threadsTitle: "线程",
        workspaceLabel: "工作区",
        threadHint: "每个线程都保留自己的 URL、绑定 agent 和消息历史。",
        startNewChat: "发起新聊天",
        workspaceDefaultPrefix: "工作区默认 agent：",
        workspaceDefaultSuffix:
          "。这只会预选未来新线程使用的 agent，不会切换当前线程已经绑定的 agent。",
        noWorkspaceDefault:
          "当前还没有设置工作区默认 agent。为下一条线程选择一个活跃 agent。这个选择不会改变你当前正在查看的线程。",
        newChat: "新聊天",
        creating: "创建中...",
        unassignedAgent: "未分配 agent",
        noMessagesYet: "还没有消息。在这个线程里开始第一轮对话吧。",
        updatedPrefix: "更新于 ",
        agentsTitle: "Agents",
        agentsHelper:
          "把 agent 保留在这里可见，这样新线程就能直接绑定，而不用跳到单独的管理页面。",
        agentsHint: "在这里创建或调整 agent，然后用它来开启下一条线程。",
        noAgentDescription:
          "当前还没有活跃 agent。先从 persona pack 创建一个，之后它会显示在这里并可用于新线程选择。",
        workspaceDefaultBadge: "工作区默认",
        thisThreadBadge: "当前线程",
        personaPackPrefix: "Persona pack：",
        personaPrefix: "角色摘要：",
        noPersonaSummary: "当前还没有角色摘要。",
        backgroundPrefix: "背景：",
        modelProfilePrefix: "模型配置：",
        modelProfileUnassigned: "未分配",
        customPreset: "自定义",
        systemPreset: "系统预设",
        setAsDefault: "设为默认",
        currentAgentImpact:
          "这个 agent 已绑定到当前线程。当相关时它可以引用长期记忆，这里做的任何修改只会影响这个线程之后的回复。",
        defaultAgentImpact:
          "这个 agent 是未来新线程的工作区默认项。它不会替换当前正在这里回复的线程 agent。",
        availableAgentImpact:
          "这个 agent 可用于未来新线程，但当前线程并不是由它在回复。"
      },
      memory: {
        title: "记忆",
        helper:
          "最近的 profile / preference 记忆会保留在聊天工作台里，让你能看清系统记住了什么。",
        hint:
          "在这里查看哪些长期记忆可用、被隐藏，或被标记为错误。",
        longTermTitle: "长期记忆",
        longTermHelper:
          "这些记忆会跨线程保留，并根据作用域决定是全局可用，还是只对当前 agent 生效。",
        threadLocalTitle: "当前线程约定",
        threadLocalHelper:
          "这些内容只在当前线程内生效，不会自动变成跨线程的长期记忆。",
        trustNote:
          "这里的信任提示保持轻量：低置信记忆会弱化展示，被隐藏的记忆在恢复前不会参与 recall，被标错的记忆会发出更强的纠错信号。",
        policyTitle1:
          "SparkCore 更倾向记住清晰、稳定的 profile 信息和 preference。",
        policyTitle2:
          "一次性情绪、临时计划或模糊猜测不太会被长期保存。",
        policyHint:
          "隐藏的记忆在恢复前不会参与 recall。低置信记忆仍可能出现，但会以更弱的视觉权重展示。",
        empty:
          "当前还没有长期记忆。一旦提取出清晰的 profile 或 preference，它就会显示在这里。",
        restoredBadge: "已恢复",
        restoredHint: "这条记忆已恢复，现在重新可见，也会再次参与 recall。",
        highConfidence: "高置信",
        mediumConfidence: "中等置信",
        lowConfidence: "低置信",
        highHint: "来自清晰、稳定的用户自述，是较强的长期记忆信号。",
        mediumHint: "有用的长期记忆信号，但展示会稍微弱一些。",
        lowHint: "这条记忆置信度较低，仍可阅读，但会被弱化展示。",
        effectActiveGlobal: "这条记忆现在会生效，因为它是跨线程共享的全局长期记忆。",
        effectActiveThisThread:
          "这条约定现在会生效，因为它只绑定在当前线程里。",
        effectActiveThisAgentCurrent:
          "这条记忆现在会生效，因为当前线程正在使用它绑定的 agent。",
        effectActiveThisAgentOther:
          "这条记忆只会在指定 agent 回复时生效，所以它不会驱动当前线程里的回复。",
        effectHiddenGlobal:
          "这条记忆当前不生效，因为它已被隐藏；恢复前不会参与 recall。",
        effectHiddenThisThread:
          "这条当前线程约定不生效，因为它已被隐藏；恢复前不会在这个线程里继续生效。",
        effectHiddenThisAgent:
          "这条只对指定 agent 生效的记忆当前不生效，因为它已被隐藏。",
        effectIncorrectGlobal:
          "这条记忆当前不生效，因为它已被标记为错误；恢复前不会参与 recall。",
        effectIncorrectThisThread:
          "这条当前线程约定当前不生效，因为它已被标记为错误。",
        effectIncorrectThisAgent:
          "这条只对指定 agent 生效的记忆当前不生效，因为它已被标记为错误。",
        effectSupersededGlobal:
          "这条记忆当前不生效，因为一个更新的值已经替代了它。",
        effectSupersededThisThread:
          "这条线程约定当前不生效，因为一个更新的值已经替代了它。",
        effectSupersededThisAgent:
          "这条只对指定 agent 生效的记忆当前不生效，因为一个更新的值已经替代了它。",
        appliesToAgentPrefix: "生效对象：",
        categoryProfile: "Profile",
        categoryPreference: "Preference",
        categoryRelationship: "Relationship",
        categoryGoal: "Goal",
        scopeGlobal: "全局",
        scopeThisAgent: "当前 agent",
        scopeThisThread: "当前线程",
        statusActive: "生效中",
        statusHidden: "已隐藏",
        statusIncorrect: "已标错",
        statusSuperseded: "已替代",
        storedPrefix: "记录于 ",
        traceFromPrefix: "来源于 ",
        traceUnavailable: "这条记忆目前没有可用的来源追踪。",
        viewContext: "查看上下文",
        hide: "隐藏",
        hiding: "隐藏中...",
        incorrect: "标记错误",
        hiddenTitle: "已隐藏的记忆",
        hiddenStatus: "已隐藏",
        hiddenHint:
          "隐藏是轻操作：它会让这条记忆暂时退出 recall，直到你恢复它，但不等同于把它标记为错误。",
        hiddenFromPrefix: "隐藏自 ",
        restore: "恢复",
        restoring: "恢复中...",
        incorrectTitle: "已标错的记忆",
        incorrectBadge: "错误",
        removedFromRecall: "已退出 recall",
        incorrectHint:
          "被标记为错误的记忆比隐藏更强，它会持续退出 recall，直到你恢复它。",
        incorrectFromPrefix: "标记来源 ",
        supersededTitle: "已替代的记忆"
      },
      common: {
        workspace: "工作区",
        signOut: "退出登录",
        signingOut: "退出中...",
        cancel: "取消",
        close: "关闭",
        saveChanges: "保存修改",
        saving: "保存中...",
        edit: "编辑"
      },
      page: {
        eyebrow: "聊天",
        titleReady: "线程工作台已就绪",
        titleUnavailable: "聊天工作台暂不可用",
        heroTitle: "多线程聊天基础已具备",
        heroDescription:
          "线程会根据 URL 解析，侧边栏会与当前会话保持同步，每个线程都保留自己的 agent 绑定和消息历史。"
      },
      sheets: {
        createAgentEyebrow: "创建 agent",
        createAgentTitle: "从 persona pack 开始",
        createAgentHelper:
          "在当前聊天工作台里创建一个新 agent，保持起始 persona 轻量，并让它马上可用于新线程。",
        noPersonaPack:
          "当前没有可用的 active persona pack，因此暂时无法创建新的 agent。",
        createAgent: "创建 agent",
        createAgentSuccessSuffix: " 已可用于新线程。",
        personaPack: "Persona pack",
        agentName: "Agent 名称",
        agentNamePlaceholder: "保留 persona 名称，或在这里改成你喜欢的名字",
        createPending: "创建中...",
        editAgentEyebrow: "Agent",
        editAgentTitle: "轻量 agent 信息",
        editAgentHelper1:
          "把 agent 编辑保持在聊天内轻量完成：在这里更新名字、头像提示、背景摘要和角色摘要，而不用离开线程工作台。",
        editAgentHelper2:
          "这里的修改只会更新这个 agent 对象，并影响之后使用它的回复。它不会重写旧线程内容或过往 runtime 摘要。",
        editAgentHelper3:
          "在当前线程里，这个 agent 在相关时仍然可以参考长期记忆。在这里切换 agent 或模型，只会影响之后的回复。",
        avatarCue: "头像提示",
        avatarCueHelper:
          "用一个简短的 emoji 或符号，给这个 agent 一个轻量的角色识别感。",
        backgroundSummary: "背景摘要",
        backgroundPlaceholder: "一个冷静的规划伙伴，帮助把目标拆成可执行的下一步。",
        backgroundHelper:
          "保持简短即可。它能让 agent 更像一个角色，但不会把侧边栏变成完整的 studio。",
        personaSummary: "角色摘要",
        modelProfile: "模型配置",
        profileHelper: "切换模型配置只会影响这个 agent 之后的回复。",
        underlyingModel: "底层模型",
        systemPromptSummary: "系统提示摘要"
      },
      thread: {
        assistantLabel: "助手",
        assistantThinking: "助手思考中",
        rename: "重命名",
        saveThreadNameSuccess: "线程标题已更新。",
        threadAgentPrefix: "线程 agent：",
        currentThreadViewFirst:
          "当前线程优先：已绑定的线程 agent 会控制这里之后的回复，而工作区默认 agent 只作为未来新线程的回退项。",
        memoryHint:
          "当这个 agent 回复时，它可以在相关时引用长期记忆。如果你之后切换 agent，只会影响未来回复，不会重写旧回合。",
        defaultSameAgent:
          "这个线程正在使用工作区默认 agent。这个线程里的后续回复会继续来自同一个 agent，除非你新开一个不同线程。",
        defaultDifferentAgentPrefix: "工作区默认 agent：",
        defaultDifferentAgentSuffix:
          "。它只影响未来新线程，不会改变当前线程已经绑定的 agent。",
        noWorkspaceDefault:
          "当前还没有设置工作区默认 agent。这个线程仍然保留自己的绑定 agent。",
        runtimeHint:
          "想知道这一轮用了哪个 agent、模型配置和记忆上下文，可以查看 assistant 回复下方的轻量摘要。",
        statusActive: "进行中",
        messagesSuffix: "条消息",
        firstTurnLead:
          "这个线程已经准备好开始第一轮。你可以从一个目标、一个规划问题，或一小段你想获得帮助的描述开始。",
        firstTurnHelper:
          "保持轻量即可：一条清晰请求就足够让对话动起来。",
        firstTurnExamples: [
          "帮我规划本周最重要的三件事。",
          "先问我几个问题，再一起决定最适合我的规划方式。",
          "把我当前的目标整理成一份简单的周计划。"
        ],
        howGenerated: "这条回复是如何生成的",
        agentUsed: "使用的 agent",
        modelProfileUsed: "使用的模型配置",
        underlyingModelUsed: "实际调用的模型",
        memoryContext: "记忆上下文",
        memoryActivity: "记忆活动",
        summaryNote:
          "这个摘要只属于当前 assistant 回合。它展示了当前线程 agent 如何处理这条回复，不会重写线程里的旧回合。",
        messageLabel: "消息",
        placeholderFirstTurn: "用一个目标、问题或规划场景开始这条线程……",
        placeholderOngoing: "在当前线程里发送一条消息……",
        firstTurnFooter:
          "这些引导只会在空线程里出现。发送第一条消息后，对话会继续进行，不再重复引导。",
        ongoingFooter:
          "这个线程会一直绑定到同一个 agent 实例。发送消息时，反馈会保持在当前线程内，也会在 pending 期间避免重复提交。",
        sendMessage: "发送消息",
        failureTimedOut: "回复超时",
        failureProvider: "模型提供方错误",
        failureGeneric: "回复失败",
        retryReply: "重试回复",
        retrying: "重试中..."
      },
      loading: {
        title: "聊天工作台加载中...",
        helper:
          "这个 loading 状态只归属于当前选中的线程，聊天视图一旦解析完成就会稳定下来。",
        eyebrow: "加载中",
        cardTitle: "正在加载线程数据",
        cardDescription: "当前线程的消息、线程元数据和已绑定 agent 正在解析中。"
      }
    } as const;
  }

  return {
    locale,
    languageSwitchLabel: "UI language",
    languages: { en: "EN", "zh-CN": "中文" },
      states: {
      fetchFailedEyebrow: "Fetch failed",
      fetchFailedTitle: "Chat data could not be loaded",
      fetchFailedDescription:
        "This is a chat data load failure, not an empty workspace. Refresh to retry the current chat view.",
      threadUnavailableEyebrow: "Thread unavailable",
      emptyStateEyebrow: "Empty state",
      threadUnavailableTitle: "This thread is not available",
      noActiveThreadTitle: "No active thread yet",
      threadUnavailableDescription:
        "The thread in the URL is no longer available in this user scope. If another accessible thread exists, it will appear in the sidebar.",
      noActiveThreadWithAgent:
        "Create a thread from the sidebar to bind it to one agent and open the conversation here.",
      noActiveThreadWithoutAgent:
        "There is no active thread yet, and this workspace also needs an active agent before chat can start.",
      requestedThreadFallback:
        "The requested thread is unavailable in your current workspace, so the latest accessible thread is shown instead.",
      retryChat: "Retry chat",
      backToWorkspace: "Back to workspace",
      noActiveAgentTitle: "No active agent available",
      noActiveAgentDescription:
        "Add or restore an agent before creating a new thread. Once an active agent is available, it can be selected here.",
      noThreadsTitle: "No threads yet",
      noThreadsWithAgent:
        "Choose an agent above to create the first thread. Once it exists, it will appear here and stay synced with the URL.",
      noThreadsWithoutAgent:
        "Create or restore an agent first, then come back here to open the first thread."
    },
    sidebar: {
      threadsTitle: "Threads",
      workspaceLabel: "Workspace",
      threadHint: "Each thread keeps its own URL, bound agent, and message history.",
      startNewChat: "Start a new chat",
      workspaceDefaultPrefix: "Workspace default agent: ",
      workspaceDefaultSuffix:
        ". This only preselects the agent for future new threads. It does not switch the agent already bound to the thread you are viewing.",
      noWorkspaceDefault:
        "No workspace default agent is set yet. Choose the active agent you want for the next thread. This choice does not change the current thread.",
      newChat: "New chat",
      creating: "Creating...",
      unassignedAgent: "Unassigned agent",
      noMessagesYet: "No messages yet. Start the first turn in this thread.",
      updatedPrefix: "Updated ",
      agentsTitle: "Agents",
      agentsHelper:
        "Visible here so new threads can bind to a known agent without opening a separate management screen.",
      agentsHint: "Create or adjust agents here, then use them when starting the next thread.",
      noAgentDescription:
        "No active agent is available yet. Create one from a persona pack here, then it will appear with its model profile and become selectable for new threads.",
      workspaceDefaultBadge: "Workspace default",
      thisThreadBadge: "This thread",
      personaPackPrefix: "Persona pack: ",
      personaPrefix: "Persona: ",
      noPersonaSummary: "No persona summary is available yet.",
      backgroundPrefix: "Background: ",
      modelProfilePrefix: "Model profile: ",
      modelProfileUnassigned: "Unassigned",
      customPreset: "Custom",
      systemPreset: "System preset",
      setAsDefault: "Set as default",
      currentAgentImpact:
        "This agent is bound to the current thread. It can reference long-term memory when relevant, and any edits here only affect future replies from this thread.",
      defaultAgentImpact:
        "This agent is the workspace default for future new threads. It does not replace the thread agent that is already replying here.",
      availableAgentImpact:
        "This agent is available for future threads when you choose it, but it is not the one replying in the current thread right now."
    },
    memory: {
      title: "Memory",
      helper:
        "Recent profile and preference memories stay visible inside chat so you can understand what the system has retained.",
      hint:
        "Use this panel to see which long-term memories are available, hidden, or marked incorrect.",
      longTermTitle: "Long-term memory",
      longTermHelper:
        "These memories persist across threads. Their scope shows whether they are global or only apply to this agent.",
      threadLocalTitle: "Current-thread notes",
      threadLocalHelper:
        "These entries only apply inside the current thread and are not treated as cross-thread long-term memory.",
      trustNote:
        "Trust cues stay lightweight here: lower-confidence memories are softened visually, hidden memories stay out of recall until restored, and incorrect memories send a stronger correction signal.",
      policyTitle1:
        "SparkCore is more likely to remember clear, stable profile facts and preferences.",
      policyTitle2:
        "It is less likely to keep one-off moods, temporary plans, or vague guesses as long-term memory.",
      policyHint:
        "Hidden memory stays out of recall until restored. Lower-confidence memory can still appear, but it is shown with lighter emphasis.",
      empty:
        "No long-term memory has been written yet. Once a clear profile or preference is extracted, it will appear here.",
      restoredBadge: "Restored",
      restoredHint: "Restored memory. It is visible again and can be used in recall.",
      highConfidence: "High confidence",
      mediumConfidence: "Moderate confidence",
      lowConfidence: "Low confidence",
      highHint: "Strong signal from a clear, stable user statement.",
      mediumHint: "Useful signal, but shown with slightly lighter emphasis.",
      lowHint: "Lower-confidence memory. It stays readable, but is visually softened.",
      effectActiveGlobal:
        "This memory is active now because it is shared as long-term global memory across threads.",
      effectActiveThisThread:
        "This note is active now because it only applies inside the current thread.",
      effectActiveThisAgentCurrent:
        "This memory is active now because the current thread is using its bound agent.",
      effectActiveThisAgentOther:
        "This memory only applies when its target agent is replying, so it is not driving the current thread right now.",
      effectHiddenGlobal:
        "This memory is not active because it is hidden and stays out of recall until restored.",
      effectHiddenThisThread:
        "This current-thread note is not active because it is hidden and will stay out of effect until restored.",
      effectHiddenThisAgent:
        "This agent-scoped memory is not active because it is hidden.",
      effectIncorrectGlobal:
        "This memory is not active because it was marked incorrect and stays out of recall until restored.",
      effectIncorrectThisThread:
        "This current-thread note is not active because it was marked incorrect.",
      effectIncorrectThisAgent:
        "This agent-scoped memory is not active because it was marked incorrect.",
      effectSupersededGlobal:
        "This memory is not active because a newer value has replaced it.",
      effectSupersededThisThread:
        "This current-thread note is not active because a newer value has replaced it.",
      effectSupersededThisAgent:
        "This agent-scoped memory is not active because a newer value has replaced it.",
      appliesToAgentPrefix: "Applies to: ",
      categoryProfile: "Profile",
      categoryPreference: "Preference",
      categoryRelationship: "Relationship",
      categoryGoal: "Goal",
      scopeGlobal: "Global",
      scopeThisAgent: "This agent",
      scopeThisThread: "This thread",
      statusActive: "Active",
      statusHidden: "Hidden",
      statusIncorrect: "Incorrect",
      statusSuperseded: "Superseded",
      storedPrefix: "Stored ",
      traceFromPrefix: "From ",
      traceUnavailable: "Source trace is unavailable for this memory.",
      viewContext: "View context",
      hide: "Hide",
      hiding: "Hiding...",
      incorrect: "Incorrect",
      hiddenTitle: "Hidden memories",
      hiddenStatus: "Hidden",
      hiddenHint:
        "Hidden memories stay out of recall until restored. Use this when you do not want to see a memory right now, but are not marking it as wrong.",
      hiddenFromPrefix: "Hidden from ",
      restore: "Restore",
      restoring: "Restoring...",
      incorrectTitle: "Incorrect memories",
      incorrectBadge: "Incorrect",
      removedFromRecall: "Removed from recall",
      incorrectHint:
        "Marked incorrect. This is stronger than hide and keeps the memory out of recall until you restore it.",
      incorrectFromPrefix: "Flagged from ",
      supersededTitle: "Replaced memories"
    },
    common: {
      workspace: "Workspace",
      signOut: "Sign out",
      signingOut: "Signing out...",
      cancel: "Cancel",
      close: "Close",
      saveChanges: "Save changes",
      saving: "Saving...",
      edit: "Edit"
    },
    page: {
      eyebrow: "Chat",
      titleReady: "Thread workspace is ready",
      titleUnavailable: "Chat workspace is unavailable",
      heroTitle: "Chat foundation for multi-thread work",
      heroDescription:
        "Threads now resolve from the URL, the sidebar stays aligned with the active conversation, and each thread keeps its own agent binding and message history."
    },
    sheets: {
      createAgentEyebrow: "Create agent",
      createAgentTitle: "Start from a persona pack",
      createAgentHelper:
        "Create a new agent inside the current chat workspace, keep the starting persona lightweight, and make it immediately available for new threads.",
      noPersonaPack:
        "No active persona pack is available right now, so chat cannot create a new agent yet.",
      createAgent: "Create agent",
      createAgentSuccessSuffix: " is ready for new threads.",
      personaPack: "Persona pack",
      agentName: "Agent name",
      agentNamePlaceholder: "Leave as the persona name or rename it here",
      createPending: "Creating...",
      editAgentEyebrow: "Agent",
      editAgentTitle: "Lightweight agent details",
      editAgentHelper1:
        "Keep agent editing lightweight inside chat. Update the agent name, avatar cue, background summary, and persona summary here without leaving the thread workspace.",
      editAgentHelper2:
        "Changes here update the agent object for future replies that use this agent. They do not rewrite older thread content or past runtime summaries.",
      editAgentHelper3:
        "In the current thread, this agent can reference long-term memory when it is relevant. Switching the agent or model here only affects future replies.",
      avatarCue: "Avatar cue",
      avatarCueHelper:
        "Use a short emoji or symbol to give this agent a lightweight identity inside chat.",
      backgroundSummary: "Background summary",
      backgroundPlaceholder:
        "A calm planning partner who helps turn goals into practical next steps.",
      backgroundHelper:
        "Keep this short. It helps the agent feel more like a character without turning the sidebar into a full studio.",
      personaSummary: "Persona summary",
      modelProfile: "Model profile",
      profileHelper: "Switching the model profile only affects future replies from this agent.",
      underlyingModel: "Underlying model",
      systemPromptSummary: "System prompt summary"
    },
    thread: {
      assistantLabel: "Assistant",
      assistantThinking: "Assistant thinking",
      rename: "Rename",
      saveThreadNameSuccess: "Thread title updated.",
      threadAgentPrefix: "Thread agent: ",
      currentThreadViewFirst:
        "Current thread view first: the bound thread agent controls later replies here, while the workspace default agent is only a fallback for future new threads.",
      memoryHint:
        "When this agent replies, it can reference relevant long-term memory for this thread. If you switch the agent later, that only affects future replies and does not rewrite older turns.",
      defaultSameAgent:
        "This thread is using the workspace default agent. Future replies in this thread come from the same agent unless you start a different thread.",
      defaultDifferentAgentPrefix: "Workspace default agent: ",
      defaultDifferentAgentSuffix:
        ". It only affects future new threads, not the agent already bound to this thread.",
      noWorkspaceDefault:
        "No workspace default agent is set. This thread still keeps its own bound agent.",
      runtimeHint:
        "Look for the lightweight summary under assistant replies when you want to understand which agent, model profile, and memory context were used for that turn.",
      statusActive: "active",
      messagesSuffix: "messages",
      firstTurnLead:
        "This thread is ready for its first turn. Start with a goal, a planning problem, or a short description of what you want help with.",
      firstTurnHelper:
        "Keep it lightweight: one clear request is enough to get the conversation moving.",
      firstTurnExamples: [
        "Help me plan my top three priorities for this week.",
        "Ask me a few questions so we can decide the best planning style for me.",
        "Let's turn my current goals into a simple weekly plan."
      ],
      howGenerated: "How this reply was generated",
      agentUsed: "Agent used",
      modelProfileUsed: "Model profile used",
      underlyingModelUsed: "Underlying model",
      memoryContext: "Memory context",
      memoryActivity: "Memory activity",
      summaryNote:
        "This summary belongs only to this assistant turn. It shows how the current thread agent handled this reply and does not rewrite older turns in the thread.",
      messageLabel: "Message",
      placeholderFirstTurn:
        "Start the thread with a goal, question, or planning problem...",
      placeholderOngoing: "Send a message into the active thread...",
      firstTurnFooter:
        "This guidance only appears for an empty thread. Once the first message is sent, the conversation continues without extra onboarding.",
      ongoingFooter:
        "This thread stays bound to one agent instance. Sending a message will keep feedback local to the active thread and avoid duplicate submits while pending.",
      sendMessage: "Send message",
      failureTimedOut: "Reply timed out",
      failureProvider: "Provider error",
      failureGeneric: "Reply failed",
      retryReply: "Retry reply",
      retrying: "Retrying..."
    },
    loading: {
      title: "Loading chat workspace...",
      helper:
        "The loading state belongs to the currently selected thread and will settle as soon as that chat view resolves.",
      eyebrow: "Loading",
      cardTitle: "Loading thread data",
      cardDescription:
        "Messages, thread metadata, and the bound agent are resolving for the current thread."
    }
  } as const;
}
