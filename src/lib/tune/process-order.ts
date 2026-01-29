import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { DEFAULT_MODEL, getBlackboxAnalysisPrompt, openai } from '@/lib/openai';
import { downloadFile, extractKeyFromUrl } from '@/storage';
import type { AnalysisResult } from '@/types/tune';
import { eq } from 'drizzle-orm';
import { extractBBLHeader, isBBLFormat } from './bbl-parser';
import {
  FRAME_NAMES,
  GOAL_NAMES,
  PROBLEM_NAMES,
  STYLE_NAMES,
  getNameById,
  mapIdsToNames,
} from './mappings';

async function runAIAnalysis(
  blackboxContent: string,
  cliDumpContent: string,
  problems: string,
  goals: string,
  flyingStyle: string,
  frameSize: string,
  motorSize: string,
  motorKv: string,
  battery: string,
  propeller: string,
  motorTemp: string,
  weight: string,
  additionalNotes: string,
  locale: string
): Promise<AnalysisResult> {
  // 将 ID 转换为可读名称
  const problemNames = mapIdsToNames(problems, PROBLEM_NAMES, locale);
  const goalNames = mapIdsToNames(goals, GOAL_NAMES, locale);
  const styleName = getNameById(flyingStyle, STYLE_NAMES, locale);
  const frameName = getNameById(frameSize, FRAME_NAMES, locale);

  // 电机温度映射
  const motorTempMap: Record<string, Record<string, string>> = {
    normal: { en: 'Normal (warm to touch)', zh: '正常 (温热)' },
    warm: { en: 'Warm (hot but touchable)', zh: '偏热 (烫手但可触摸)' },
    hot: { en: 'Hot (too hot to touch)', zh: '过热 (无法触摸)' },
  };
  const motorTempName = motorTemp ? (motorTempMap[motorTemp]?.[locale] || motorTemp) : '';

  const prompt = getBlackboxAnalysisPrompt(locale)
    .replace('{problems}', problemNames)
    .replace('{goals}', goalNames)
    .replace('{flyingStyle}', styleName)
    .replace('{frameSize}', frameName)
    .replace('{motorSize}', motorSize || 'Not specified')
    .replace('{motorKv}', motorKv || 'Not specified')
    .replace('{battery}', battery ? battery.toUpperCase() : 'Not specified')
    .replace('{propeller}', propeller || 'Not specified')
    .replace('{motorTemp}', motorTempName || 'Not specified')
    .replace('{weight}', weight || 'Not specified')
    .replace('{additionalNotes}', additionalNotes || 'None');

  // 构建用户消息
  let userMessage = `Here is the blackbox log data to analyze:\n\n${blackboxContent}`;
  if (cliDumpContent) {
    userMessage += `\n\n--- Current CLI Settings (diff output) ---\n${cliDumpContent}`;
  }
  userMessage +=
    '\n\nPlease analyze this data and provide optimized PID settings.';

  console.log('AI Analysis - Problems:', problemNames);
  console.log('AI Analysis - Goals:', goalNames);
  console.log('AI Analysis - Style:', styleName);
  console.log('AI Analysis - Frame:', frameName);
  console.log('AI Analysis - Motor:', motorSize, motorKv + 'KV');
  console.log('AI Analysis - Battery:', battery);
  console.log('AI Analysis - Propeller:', propeller);
  console.log('AI Analysis - Motor Temp:', motorTempName);
  console.log('AI Analysis - Weight:', weight);
  console.log('AI Analysis - Blackbox content length:', blackboxContent.length);
  console.log('AI Analysis - CLI dump included:', !!cliDumpContent);

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('Failed to generate analysis: empty response');
    }

    // 从响应中提取 JSON（可能包含 markdown 或思考过程）
    let jsonStr = result;

    // 移除 <think>...</think> 标签及其内容
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 尝试提取 ```json ... ``` 代码块
    const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // 尝试找到第一个 { 和最后一个 }
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
    }

    return JSON.parse(jsonStr) as AnalysisResult;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // 提取 OpenAI 错误信息
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    const errObj = error as Record<string, unknown>;
    if (errObj && typeof errObj === 'object') {
      const message = errObj.message || errObj.error || errObj.statusText;
      if (message) {
        throw new Error(`OpenAI API error: ${String(message)}`);
      }
    }
    throw new Error('OpenAI API error: Unknown error');
  }
}

async function sendResultEmail(
  to: string,
  orderNumber: string,
  analysis: AnalysisResult,
  problems: string,
  goals: string,
  flyingStyle: string,
  frameSize: string,
  locale: string,
  resultUrl: string
): Promise<{ messageId?: string }> {
  const isZh = locale === 'zh';

  // 获取可读名称
  const problemNames = mapIdsToNames(problems, PROBLEM_NAMES, locale);
  const goalNames = mapIdsToNames(goals, GOAL_NAMES, locale);
  const styleName = getNameById(flyingStyle, STYLE_NAMES, locale);
  const frameName = getNameById(frameSize, FRAME_NAMES, locale);

  const subject = isZh
    ? `[FPVtune] 您的 PID 调参报告已准备好 - ${orderNumber}`
    : `[FPVtune] Your PID Tuning Report is Ready - ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; padding: 24px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .order-badge { display: inline-block; background: #eff6ff; padding: 8px 16px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #1e40af; margin: 16px 0; }
    .section { margin: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: #111; margin-bottom: 12px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; display: inline-block; }
    .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f9fafb; padding: 16px; border-radius: 8px; }
    .config-item { }
    .config-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .config-value { font-size: 14px; color: #111; font-weight: 500; }
    .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .issues-list { background: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .issues-list ul { margin: 8px 0 0 0; padding-left: 20px; }
    .issues-list li { margin: 4px 0; color: #92400e; }
    .recommendations-list { background: #eff6ff; border: 1px solid #93c5fd; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .recommendations-list ul { margin: 8px 0 0 0; padding-left: 20px; }
    .recommendations-list li { margin: 4px 0; color: #1e40af; }
    .cli-box { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap; overflow-x: auto; max-height: 300px; overflow-y: auto; }
    .steps { background: #f9fafb; padding: 16px; border-radius: 8px; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin: 8px 0; color: #374151; }
    .footer { text-align: center; padding: 24px 0; color: #6b7280; font-size: 12px; }
    .footer a { color: #3b82f6; text-decoration: none; }
    .view-btn { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .view-btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">FPVtune</div>
        <p style="color: #6b7280; margin: 8px 0 0 0;">${isZh ? '神经网络驱动的 PID 调参' : 'Neural Network-Powered PID Tuning'}</p>
      </div>

      <h2 style="text-align: center; margin: 0;">${isZh ? '您的 PID 调参报告已准备好!' : 'Your PID Tuning Report is Ready!'}</h2>
      <p style="text-align: center;"><span class="order-badge">${isZh ? '订单号' : 'Order'}: ${orderNumber}</span></p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${resultUrl}" class="view-btn" style="color: white;">${isZh ? '查看完整报告' : 'View Full Report'}</a>
        <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">${isZh ? '此链接 7 天内有效，请注意保存' : 'This link is valid for 7 days, please save it'}</p>
      </div>

      <div class="section">
        <div class="section-title">${isZh ? '您的配置' : 'Your Configuration'}</div>
        <div class="config-grid">
          <div class="config-item">
            <div class="config-label">${isZh ? '需要解决的问题' : 'Problems to Fix'}</div>
            <div class="config-value">${problemNames}</div>
          </div>
          <div class="config-item">
            <div class="config-label">${isZh ? '调参目标' : 'Tuning Goals'}</div>
            <div class="config-value">${goalNames}</div>
          </div>
          <div class="config-item">
            <div class="config-label">${isZh ? '飞行风格' : 'Flying Style'}</div>
            <div class="config-value">${styleName}</div>
          </div>
          <div class="config-item">
            <div class="config-label">${isZh ? '机架尺寸' : 'Frame Size'}</div>
            <div class="config-value">${frameName}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${isZh ? '分析摘要' : 'Analysis Summary'}</div>
        <div class="summary-box">
          <p style="margin: 0;">${analysis.analysis.summary}</p>
        </div>
      </div>

      ${
        analysis.analysis.issues?.length
          ? `
      <div class="section">
        <div class="section-title">${isZh ? '发现的问题' : 'Issues Identified'}</div>
        <div class="issues-list">
          <ul>
            ${analysis.analysis.issues.map((issue) => `<li>${issue}</li>`).join('')}
          </ul>
        </div>
      </div>
      `
          : ''
      }

      ${
        analysis.analysis.recommendations?.length
          ? `
      <div class="section">
        <div class="section-title">${isZh ? '优化建议' : 'Recommendations'}</div>
        <div class="recommendations-list">
          <ul>
            ${analysis.analysis.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      </div>
      `
          : ''
      }

      <div class="section">
        <div class="section-title">${isZh ? 'CLI 命令' : 'CLI Commands'}</div>
        <p style="font-size: 14px; color: #6b7280;">${isZh ? '复制以下命令到 Betaflight 配置器的 CLI 标签页：' : 'Copy the following commands into Betaflight Configurator CLI tab:'}</p>
        <div class="cli-box">${analysis.cli_commands}</div>
      </div>

      <div class="section">
        <div class="section-title">${isZh ? '如何应用设置' : 'How to Apply'}</div>
        <div class="steps">
          <ol>
            <li>${isZh ? '通过 USB 连接飞控' : 'Connect your flight controller via USB'}</li>
            <li>${isZh ? '打开 Betaflight 配置器' : 'Open Betaflight Configurator'}</li>
            <li>${isZh ? '进入 CLI 标签页' : 'Go to the CLI tab'}</li>
            <li>${isZh ? '粘贴上述命令并按回车' : 'Paste the commands above and press Enter'}</li>
            <li>${isZh ? '输入 "save" 保存设置' : 'Type "save" to save settings'}</li>
            <li>${isZh ? '安全试飞!' : 'Test fly safely!'}</li>
          </ol>
        </div>
      </div>

      <p style="text-align: center; margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 8px; color: #1e40af;">
        ${isZh ? '附件包含 TXT 命令文件，可直接复制粘贴到 Betaflight CLI' : 'Attachment includes TXT commands file, ready to copy & paste into Betaflight CLI'}
      </p>
    </div>

    <div class="footer">
      <p>FPVtune - Neural Network-Powered Betaflight PID Tuning</p>
      <p>${isZh ? '如有问题，请联系' : 'Questions? Contact'} <a href="mailto:support@fpvtune.com">support@fpvtune.com</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 生成 CLI 命令的 TXT 文件内容
  const cliTxtContent = `# FPVtune CLI Commands - ${orderNumber}
# Generated: ${new Date().toISOString().split('T')[0]}
#
# ${isZh ? '使用方法：复制以下所有命令，粘贴到 Betaflight Configurator CLI 标签页' : 'Usage: Copy all commands below and paste into Betaflight Configurator CLI tab'}
# ${isZh ? '粘贴后输入 "save" 保存设置' : 'After pasting, type "save" to save settings'}
#
# ============================================================

${analysis.cli_commands || '# No CLI commands generated'}
`;

  const { data, error } = await resend.emails.send({
    from: 'FPVtune <onboarding@resend.dev>',
    to,
    subject,
    html,
    attachments: [
      {
        content: Buffer.from(cliTxtContent, 'utf-8').toString('base64'),
        filename: `FPVtune-CLI-${orderNumber}.txt`,
      },
    ],
  });

  if (error) {
    console.error('Email send error:', error);
    throw new Error(
      typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : JSON.stringify(error)
    );
  }

  return { messageId: data?.id };
}

export async function processOrder(orderId: string): Promise<void> {
  const startTime = Date.now();
  console.log(`[processOrder] Starting order processing: ${orderId}`);

  const [order] = await db
    .select()
    .from(tuneOrder)
    .where(eq(tuneOrder.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  console.log(
    `[processOrder] Found order: ${order.orderNumber}, current status: ${order.status}`
  );

  // 如果订单已经完成，跳过处理
  if (order.status === 'completed') {
    console.log(
      `[processOrder] Order ${order.orderNumber} already completed, skipping`
    );
    return;
  }

  try {
    await db
      .update(tuneOrder)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(tuneOrder.id, orderId));

    console.log(
      `[processOrder] Order ${order.orderNumber} status updated to processing`
    );

    // 从 R2 读取 BBL 文件（主存储）
    // 数据库中的 blackboxContent 已废弃，不再使用
    let blackboxContent = '';
    let rawBuffer: Buffer | null = null;

    if (order.blackboxUrl) {
      // 从 R2 下载
      console.log(
        `[${order.orderNumber}] Downloading blackbox from R2: ${order.blackboxUrl}`
      );
      const blackboxKey = extractKeyFromUrl(order.blackboxUrl);
      console.log(
        `[${order.orderNumber}] Extracted blackbox key: ${blackboxKey}`
      );
      if (blackboxKey) {
        try {
          const { content, contentType } = await downloadFile(blackboxKey);
          console.log(
            `[${order.orderNumber}] R2 download successful - contentType: ${contentType}, buffer size: ${content.length}`
          );
          rawBuffer = content;

          // 验证是否为 BBL 格式
          if (!isBBLFormat(rawBuffer)) {
            console.error(
              `[${order.orderNumber}] Downloaded content is not valid BBL format`
            );
            throw new Error('Downloaded file is not a valid BBL format');
          }
        } catch (downloadError) {
          console.error(
            `[${order.orderNumber}] Failed to download blackbox file:`,
            downloadError
          );
          throw new Error('Failed to download blackbox file from storage');
        }
      } else {
        throw new Error('Invalid blackbox file URL');
      }
    } else if (order.blackboxContent) {
      // 兼容旧订单：从数据库读取（已废弃）
      console.log(
        `[${order.orderNumber}] Using legacy blackbox content from database`
      );
      rawBuffer = Buffer.from(order.blackboxContent, 'base64');
      console.log(
        `[${order.orderNumber}] Decoded buffer size: ${rawBuffer.length}`
      );

      // 验证数据是否有效
      if (!isBBLFormat(rawBuffer)) {
        console.error(
          `[${order.orderNumber}] Database content is not valid BBL format, data may be corrupted`
        );
        throw new Error(
          'Blackbox data is corrupted. Please contact support for a refund or re-upload.'
        );
      }
    } else {
      throw new Error('No blackbox content or URL in order');
    }

    // 添加调试日志
    const firstBytes = rawBuffer.slice(0, 100).toString('utf-8');
    console.log(
      `[${order.orderNumber}] Buffer first 100 bytes: ${JSON.stringify(firstBytes)}`
    );

    // 处理 BBL 文件：只提取头部配置（不需要帧数据）
    if (rawBuffer) {
      if (isBBLFormat(rawBuffer)) {
        // BBL 格式：直接提取头部配置
        console.log(
          `[${order.orderNumber}] BBL format detected, extracting header...`
        );
        blackboxContent = extractBBLHeader(rawBuffer);
        console.log(
          `[${order.orderNumber}] BBL header extracted: ${blackboxContent.length} chars, ${blackboxContent.split('\n').length} lines`
        );
      } else {
        // 非 BBL 格式（可能是 CSV 或其他文本格式）：直接转换
        blackboxContent = rawBuffer.toString('utf-8');
        console.log(
          `[${order.orderNumber}] Non-BBL format, using full content: ${blackboxContent.length} chars`
        );
      }

      // 记录提取的内容前 500 字符用于调试
      console.log(
        `[${order.orderNumber}] Blackbox content preview:\n${blackboxContent.slice(0, 500)}`
      );
    }

    // 优先从数据库读取 CLI dump 内容
    let cliDumpContent = '';
    if (order.cliDumpContent) {
      cliDumpContent = order.cliDumpContent;
      console.log(
        `[${order.orderNumber}] Using CLI dump content from database, length: ${cliDumpContent.length}`
      );
    } else if (order.cliDumpUrl) {
      // 后备方案：从 R2 下载
      console.log(`Downloading CLI dump file from: ${order.cliDumpUrl}`);
      const cliDumpKey = extractKeyFromUrl(order.cliDumpUrl);
      if (cliDumpKey) {
        try {
          const { content } = await downloadFile(cliDumpKey);
          cliDumpContent = content.toString('utf-8');
          console.log(
            `CLI dump file downloaded, content length: ${cliDumpContent.length}`
          );
        } catch (downloadError) {
          console.error('Failed to download CLI dump file:', downloadError);
          // CLI dump 是可选的，不阻止流程
        }
      }
    }

    console.log(
      `[processOrder] Running AI analysis for order ${order.orderNumber}...`
    );
    const aiStartTime = Date.now();
    const analysis = await runAIAnalysis(
      blackboxContent,
      cliDumpContent,
      order.problems || '',
      order.goals || '',
      order.flyingStyle || '',
      order.frameSize || '',
      order.motorSize || '',
      order.motorKv || '',
      order.battery || '',
      order.propeller || '',
      order.motorTemp || '',
      order.weight || '',
      order.additionalNotes || '',
      order.locale || 'en'
    );
    console.log(
      `[processOrder] AI analysis completed in ${Date.now() - aiStartTime}ms`
    );

    // 生成结果页面链接
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://fpvtune.com';
    const resultUrl = `${baseUrl}/${order.locale || 'en'}/tune/success?order=${order.orderNumber}`;

    // 先保存分析结果，确保即使邮件发送失败也不会丢失
    await db
      .update(tuneOrder)
      .set({
        status: 'completed',
        analysisResult: analysis,
        cliCommands: analysis.cli_commands,
        resultUrl: resultUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, orderId));

    console.log(
      `[processOrder] Analysis saved for order ${order.orderNumber}, now sending email...`
    );

    // 尝试发送邮件，失败不影响订单状态
    try {
      const emailStartTime = Date.now();
      const { messageId } = await sendResultEmail(
        order.customerEmail,
        order.orderNumber,
        analysis,
        order.problems || '',
        order.goals || '',
        order.flyingStyle || 'freestyle',
        order.frameSize || '5',
        order.locale || 'en',
        resultUrl
      );
      console.log(
        `[processOrder] Email sent in ${Date.now() - emailStartTime}ms, messageId: ${messageId}`
      );

      // 更新邮件发送状态
      await db
        .update(tuneOrder)
        .set({
          emailSentAt: new Date(),
          emailMessageId: messageId,
          updatedAt: new Date(),
        })
        .where(eq(tuneOrder.id, orderId));
    } catch (emailError) {
      // 邮件发送失败，记录错误但不影响订单状态
      console.error(
        `[processOrder] Email send failed for order ${order.orderNumber}:`,
        emailError
      );
      console.log(
        `[processOrder] Order ${order.orderNumber} completed but email not sent`
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `[processOrder] Order ${order.orderNumber} completed successfully in ${totalTime}ms!`
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(
      `[processOrder] Error processing order ${order.orderNumber} after ${totalTime}ms:`,
      error
    );
    console.error('[processOrder] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    await db
      .update(tuneOrder)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, orderId));

    // 确保抛出的是 Error 实例
    if (error instanceof Error) {
      throw error;
    }

    // 尝试提取错误信息
    let errorMessage = 'Unknown error';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      if ('message' in errObj && typeof errObj.message === 'string') {
        errorMessage = errObj.message;
      } else if ('error' in errObj && typeof errObj.error === 'string') {
        errorMessage = errObj.error;
      } else if (
        'statusText' in errObj &&
        typeof errObj.statusText === 'string'
      ) {
        errorMessage = errObj.statusText;
      } else {
        try {
          errorMessage = JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          );
        } catch {
          errorMessage = Object.prototype.toString.call(error);
        }
      }
    }
    throw new Error(errorMessage);
  }
}
