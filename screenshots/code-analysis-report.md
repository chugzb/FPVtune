# Tune 流程代码分析报告

## 代码结构

### 主要文件
1. **页面入口**: `src/app/[locale]/tune/page.tsx`
   - 简单的页面组件,渲染 `TuneWizard`

2. **核心组件**: `src/components/tune/tune-wizard.tsx`
   - 包含完整的 6 步向导流程
   - 状态管理使用 React useState
   - 总共 1273 行代码

### 流程步骤

#### 步骤 1: Upload Files (上传文件)
- 上传 Blackbox Log (必需)
- 上传 CLI Dump (可选)
- 验证逻辑: `formData.blackboxFile !== null`

#### 步骤 2: Problems (问题选择)
- 多选: Prop Wash, Hot Motors, Sluggish, Oscillation, Bouncy, Noise
- 可选文本框: Additional Notes
- 验证逻辑: `formData.problems.length > 0`

#### 步骤 3: Goals (目标选择)
- 多选: Locked-in Feel, Smooth, Snappy, Efficient, Balanced
- 可选文本框: Custom Goal
- 验证逻辑: `formData.goals.length > 0`

#### 步骤 4: Flying Style (飞行风格)
- 单选: Freestyle, Racing, Cinematic, Long Range
- 验证逻辑: `formData.flyingStyle !== ''`

#### 步骤 5: Frame Size (机架尺寸)
- 单选: 2-3", 5", 7", 10+"
- **验证逻辑**: `formData.frameSize !== ''`
- **Frame IDs**: `['2-3', '5', '7', '10+']`

#### 步骤 6: Payment (支付)
- 输入邮箱
- 显示订单摘要
- 点击 "Proceed to Payment" 调用 `/api/tune/checkout`
- 验证逻辑: `formData.email !== ''`

## 发现的问题

### 1. 翻译 Key 格式问题 (可能的根本原因)

**代码中的 Frame IDs**:
```typescript
const frameIds = ['2-3', '5', '7', '10+'];
```

**翻译文件中的 Keys** (`messages/en.json`):
```json
"frames": {
  "items": {
    "5": { "name": "5\"", "description": "Freestyle / Racing" },
    "7": { "name": "7\"", "description": "Long Range / Cinematic" },
    "2-3": { "name": "2-3\"", "description": "Tiny Whoop / Toothpick" },
    "10+": { "name": "10\"+", "description": "Cinelifter / X-Class" }
  }
}
```

**渲染代码**:
```typescript
{frameIds.map((id) => (
  <button
    key={id}
    type="button"
    onClick={() => onSelect(id)}
    className={...}
  >
    <div className="text-4xl font-bold text-white mb-2">
      {t(`items.${id}.name` as any)}
    </div>
    <p className="text-sm text-gray-500">
      {t(`items.${id}.description` as any)}
    </p>
  </button>
))}
```

**问题分析**:
- 翻译 key 使用了特殊字符 `"5"`, `"7"`, `"2-3"`, `"10+"`
- 这些 key 在 JSON 中是有效的,但在 TypeScript 的模板字符串中可能有问题
- 特别是 `"10+"` 中的 `+` 符号可能导致解析问题

### 2. 状态管理问题

**状态定义**:
```typescript
const [formData, setFormData] = useState<FormData>({
  blackboxFile: null,
  cliDumpFile: null,
  problems: [],
  goals: [],
  additionalNotes: '',
  customGoal: '',
  flyingStyle: '',
  frameSize: '',  // 初始值为空字符串
  email: '',
});
```

**选择处理**:
```typescript
const handleFrameSizeSelect = (size: string) => {
  setFormData((prev) => ({ ...prev, frameSize: size }));
};
```

这部分看起来是正确的。

### 3. 可能的客户端路由问题

在测试中,Python Playwright 脚本显示:
- 步骤 1-5 都成功完成
- 但在步骤 6 时,Continue 按钮保持 disabled 状态
- 这表明 `formData.frameSize` 可能没有正确设置

## 根本原因推测

基于测试结果和代码分析,最可能的原因是:

### 原因 1: 翻译 Key 解析失败
- 当 `t(\`items.${id}.name\`)` 尝试获取 `"10+"` 的翻译时
- `+` 符号可能被解释为字符串连接操作符
- 导致翻译失败,按钮无法正确渲染

### 原因 2: 点击事件未触发
- 如果按钮渲染失败或不可见
- 点击事件可能无法触发
- `onSelect(id)` 不会被调用
- `formData.frameSize` 保持为空字符串

### 原因 3: 生产环境构建问题
- 开发环境可能工作正常
- 但生产环境的代码压缩/优化可能导致问题
- 特别是涉及特殊字符的翻译 key

## 建议的修复方案

### 方案 1: 修改翻译 Key (推荐)

将翻译文件中的 key 改为更安全的格式:

**修改前**:
```json
"frames": {
  "items": {
    "5": {...},
    "7": {...},
    "2-3": {...},
    "10+": {...}
  }
}
```

**修改后**:
```json
"frames": {
  "items": {
    "inch5": {...},
    "inch7": {...},
    "inch2_3": {...},
    "inch10plus": {...}
  }
}
```

**同时修改代码**:
```typescript
const frameIds = ['inch2_3', 'inch5', 'inch7', 'inch10plus'];
```

### 方案 2: 使用映射对象

创建一个 ID 到翻译 key 的映射:

```typescript
const frameIdMap = {
  '2-3': '2-3',
  '5': '5',
  '7': '7',
  '10+': '10plus'  // 避免 + 符号
};

// 渲染时使用
{t(`items.${frameIdMap[id]}.name` as any)}
```

### 方案 3: 直接使用翻译对象

不使用模板字符串,而是直接访问翻译对象:

```typescript
const tFrames = useTranslations('TunePage.wizard.frames.items');

// 渲染时
{tFrames(`${id}.name` as any)}
```

### 方案 4: 添加调试日志

在生产环境添加临时日志,确认问题:

```typescript
const handleFrameSizeSelect = (size: string) => {
  console.log('Frame size selected:', size);
  setFormData((prev) => {
    const newData = { ...prev, frameSize: size };
    console.log('New formData:', newData);
    return newData;
  });
};
```

## 测试建议

### 1. 本地测试
```bash
# 构建生产版本
pnpm run build

# 本地运行生产版本
pnpm run start

# 测试步骤 5 的按钮点击
```

### 2. 浏览器开发者工具
- 打开 Console 查看是否有 JavaScript 错误
- 检查 Network 标签,确认没有 404 错误
- 使用 React DevTools 查看 formData 状态

### 3. 添加错误边界
```typescript
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <StepFrameSize ... />
</ErrorBoundary>
```

## 下一步行动

1. **立即**: 检查生产环境的浏览器控制台,查找 JavaScript 错误
2. **短期**: 实施方案 1 (修改翻译 key),这是最安全的方案
3. **中期**: 添加端到端测试,覆盖所有 6 个步骤
4. **长期**: 考虑使用状态管理库 (如 Zustand) 替代 useState

## 相关文件

- `src/components/tune/tune-wizard.tsx` - 主要组件
- `messages/en.json` - 英文翻译
- `messages/zh.json` - 中文翻译
- `src/app/api/tune/checkout/route.ts` - Checkout API
- `src/lib/creem.ts` - Creem 支付配置
