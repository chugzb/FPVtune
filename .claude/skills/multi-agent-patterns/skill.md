---
name: multi-agent-patterns
description: 基于 Anthropic 研究的多代理模式指南，用于构建 AI 代理系统。当需要设计多代理架构、实现代理协作、或构建复杂的 AI 工作流时使用此技能。
---

# Multi-Agent Patterns

基于 Anthropic 研究的多代理模式指南，用于构建高效的 AI 代理系统。

## 核心模式

### 1. Prompt Chaining (提示链)

将任务分解为一系列步骤，每个 LLM 调用处理前一个的输出。

```typescript
// 示例：文档处理流水线
async function processDocument(doc: string) {
  // Step 1: 提取关键信息
  const extracted = await llm.call({
    prompt: `从以下文档中提取关键信息：\n${doc}`
  });

  // Step 2: 分类
  const classified = await llm.call({
    prompt: `对以下信息进行分类：\n${extracted}`
  });

  // Step 3: 生成摘要
  const summary = await llm.call({
    prompt: `基于分类结果生成摘要：\n${classified}`
  });

  return summary;
}
```

适用场景：
- 文档处理流水线
- 多步骤数据转换
- 渐进式内容生成

### 2. Routing (路由)

根据输入类型将请求路由到专门的处理器。

```typescript
// 示例：智能路由器
async function routeRequest(input: string) {
  // 分类输入
  const category = await llm.call({
    prompt: `将以下请求分类为：code/docs/support/other\n${input}`
  });

  // 路由到专门处理器
  switch (category) {
    case 'code':
      return codeAgent.handle(input);
    case 'docs':
      return docsAgent.handle(input);
    case 'support':
      return supportAgent.handle(input);
    default:
      return generalAgent.handle(input);
  }
}
```

适用场景：
- 客服系统
- 多领域问答
- 任务分发

### 3. Parallelization (并行化)

同时执行多个独立任务，然后聚合结果。

```typescript
// 示例：并行分析
async function parallelAnalysis(data: string) {
  const [
    sentiment,
    entities,
    summary,
    keywords
  ] = await Promise.all([
    llm.call({ prompt: `分析情感：${data}` }),
    llm.call({ prompt: `提取实体：${data}` }),
    llm.call({ prompt: `生成摘要：${data}` }),
    llm.call({ prompt: `提取关键词：${data}` })
  ]);

  return { sentiment, entities, summary, keywords };
}
```

适用场景：
- 多维度分析
- 批量处理
- 独立子任务

### 4. Orchestrator-Workers (编排器-工作者)

中央编排器动态分配任务给专门的工作者代理。

```typescript
// 示例：项目编排器
class ProjectOrchestrator {
  private workers = {
    frontend: new FrontendAgent(),
    backend: new BackendAgent(),
    database: new DatabaseAgent(),
    testing: new TestingAgent()
  };

  async executeProject(requirements: string) {
    // 分解任务
    const tasks = await this.decomposeTasks(requirements);

    // 分配给工作者
    const results = [];
    for (const task of tasks) {
      const worker = this.workers[task.type];
      const result = await worker.execute(task);
      results.push(result);

      // 根据结果调整后续任务
      await this.adjustPlan(results);
    }

    return this.aggregateResults(results);
  }
}
```

适用场景：
- 复杂项目管理
- 动态任务分配
- 需要协调的多步骤工作流

### 5. Evaluator-Optimizer (评估器-优化器)

一个代理生成输出，另一个评估并提供改进反馈。

```typescript
// 示例：代码审查循环
async function codeReviewLoop(code: string, maxIterations = 3) {
  let currentCode = code;

  for (let i = 0; i < maxIterations; i++) {
    // 评估代码
    const review = await evaluator.call({
      prompt: `审查以下代码，指出问题：\n${currentCode}`
    });

    // 检查是否通过
    if (review.includes('APPROVED')) {
      return currentCode;
    }

    // 优化代码
    currentCode = await optimizer.call({
      prompt: `根据反馈改进代码：\n反馈：${review}\n代码：${currentCode}`
    });
  }

  return currentCode;
}
```

适用场景：
- 代码审查
- 内容优化
- 质量保证

## 代理通信模式

### Hub-and-Spoke (中心辐射)

```
       [Agent A]
           |
[Agent B]--[Hub]--[Agent C]
           |
       [Agent D]
```

中央 Hub 协调所有通信，适合需要集中控制的场景。

### Peer-to-Peer (点对点)

```
[Agent A]---[Agent B]
    |   \   /   |
    |    \ /    |
    |     X     |
    |    / \    |
    |   /   \   |
[Agent D]---[Agent C]
```

代理直接通信，适合去中心化协作。

### Pipeline (流水线)

```
[Agent A] -> [Agent B] -> [Agent C] -> [Agent D]
```

线性处理流程，适合顺序依赖的任务。

## 状态管理

### 共享状态

```typescript
interface SharedState {
  context: string;
  history: Message[];
  artifacts: Map<string, any>;
}

class StateManager {
  private state: SharedState;

  update(agentId: string, changes: Partial<SharedState>) {
    // 原子更新
    this.state = { ...this.state, ...changes };
    // 通知其他代理
    this.broadcast(agentId, changes);
  }
}
```

### 消息传递

```typescript
interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'broadcast';
  payload: any;
}

class MessageBus {
  async send(message: AgentMessage) {
    const agent = this.agents.get(message.to);
    return agent.receive(message);
  }
}
```

## 错误处理

### 重试策略

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 降级策略

```typescript
async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch {
    return await fallback();
  }
}
```

## 最佳实践

1. **明确职责**: 每个代理应有清晰定义的职责范围
2. **最小权限**: 代理只应访问完成任务所需的资源
3. **可观测性**: 记录所有代理交互用于调试
4. **优雅降级**: 单个代理失败不应导致整个系统崩溃
5. **超时控制**: 为所有代理调用设置合理超时
6. **幂等性**: 设计可重试的操作

## 参考资源

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Cloudflare Agents Patterns](https://developers.cloudflare.com/agents/patterns/)
- [LangChain Multi-Agent](https://python.langchain.com/docs/modules/agents/)
