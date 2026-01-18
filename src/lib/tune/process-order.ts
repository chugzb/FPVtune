import crypto from 'crypto';
import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { DEFAULT_MODEL, getBlackboxAnalysisPrompt, openai } from '@/lib/openai';
import type { AnalysisResult } from '@/types/tune';
import { eq } from 'drizzle-orm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function runAIAnalysis(
  blackboxContent: string,
  problems: string,
  goals: string,
  flyingStyle: string,
  frameSize: string,
  additionalNotes: string,
  locale: string
): Promise<AnalysisResult> {
  const prompt = getBlackboxAnalysisPrompt(locale)
    .replace('{problems}', problems || 'Not specified')
    .replace('{goals}', goals || 'Not specified')
    .replace('{flyingStyle}', flyingStyle || 'Not specified')
    .replace('{frameSize}', frameSize || 'Not specified')
    .replace('{additionalNotes}', additionalNotes || 'None');

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: `Here is the blackbox log data to analyze:\n\n${blackboxContent}\n\nPlease analyze this data and provide optimized PID settings.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const result = completion.choices[0]?.message?.content;
  if (!result) {
    throw new Error('Failed to generate analysis');
  }

  return JSON.parse(result) as AnalysisResult;
}

async function generatePDF(
  orderNumber: string,
  customerEmail: string,
  createdAt: Date,
  analysis: AnalysisResult,
  flyingStyle: string,
  frameSize: string
): Promise<{ buffer: Buffer; hash: string }> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const lineHeight = 16;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addText = (
    text: string,
    size: number,
    isBold = false,
    isMono = false
  ) => {
    const selectedFont = isMono ? fontMono : isBold ? fontBold : font;
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: selectedFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight + (size > 14 ? 8 : 4);
  };

  const addSection = (title: string) => {
    y -= 10;
    addText(title, 14, true);
    y -= 5;
  };

  // Header
  addText('FPVtune - PID Tuning Report', 20, true);
  y -= 10;
  addText(`Order: ${orderNumber}`, 10);
  addText(`Email: ${customerEmail}`, 10);
  addText(`Date: ${createdAt.toISOString().split('T')[0]}`, 10);
  addText(`Flying Style: ${flyingStyle} | Frame Size: ${frameSize}"`, 10);

  // Analysis Summary
  addSection('Analysis Summary');
  const summaryLines = (
    analysis.analysis?.summary || 'No summary available'
  ).split('\n');
  for (const line of summaryLines) {
    if (line.trim()) addText(line.slice(0, 80), 10);
  }

  // Issues
  if (analysis.analysis?.issues?.length) {
    addSection('Issues Identified');
    for (const issue of analysis.analysis.issues.slice(0, 5)) {
      addText(`- ${issue.slice(0, 75)}`, 10);
    }
  }

  // PID Values
  addSection('PID Values');
  const pid = analysis.pid;
  if (pid) {
    addText(
      `Roll:  P=${pid.roll?.p || 0}  I=${pid.roll?.i || 0}  D=${pid.roll?.d || 0}  F=${pid.roll?.f || 0}`,
      10,
      false,
      true
    );
    addText(
      `Pitch: P=${pid.pitch?.p || 0}  I=${pid.pitch?.i || 0}  D=${pid.pitch?.d || 0}  F=${pid.pitch?.f || 0}`,
      10,
      false,
      true
    );
    addText(
      `Yaw:   P=${pid.yaw?.p || 0}  I=${pid.yaw?.i || 0}  D=${pid.yaw?.d || 0}  F=${pid.yaw?.f || 0}`,
      10,
      false,
      true
    );
  }

  // Filters
  if (analysis.filters) {
    addSection('Filter Settings');
    const f = analysis.filters;
    addText(
      `Gyro Lowpass: ${f.gyro_lowpass_hz || 0} Hz | Gyro Lowpass2: ${f.gyro_lowpass2_hz || 0} Hz`,
      10,
      false,
      true
    );
    addText(
      `D-term Lowpass: ${f.dterm_lowpass_hz || 0} Hz | D-term Lowpass2: ${f.dterm_lowpass2_hz || 0} Hz`,
      10,
      false,
      true
    );
    addText(
      `Dynamic Notch: ${f.dyn_notch_min_hz || 0}-${f.dyn_notch_max_hz || 0} Hz (Q=${f.dyn_notch_q || 0})`,
      10,
      false,
      true
    );
  }

  // CLI Commands (new page)
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;
  addText('CLI Commands', 16, true);
  y -= 10;
  addText('Copy and paste into Betaflight Configurator CLI:', 10);
  y -= 10;

  const cliLines = (
    analysis.cli_commands || '# No CLI commands generated'
  ).split('\n');
  for (const line of cliLines.slice(0, 40)) {
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    addText(line.slice(0, 85), 8, false, true);
  }

  // Footer
  y = margin;
  page.drawText('Generated by FPVtune.com - AI-Powered Betaflight PID Tuning', {
    x: margin,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  return { buffer, hash };
}

async function sendResultEmail(
  to: string,
  orderNumber: string,
  analysis: AnalysisResult,
  pdfBuffer: Buffer,
  locale: string
): Promise<{ messageId?: string }> {
  const isZh = locale === 'zh';

  const subject = isZh
    ? `[FPVtune] 您的 PID 调参报告已准备好 - ${orderNumber}`
    : `[FPVtune] Your PID Tuning Report is Ready - ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .content { padding: 30px 0; }
    .order-number { background: #f0f9ff; padding: 12px 20px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #1e40af; }
    .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cli-box { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap; overflow-x: auto; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FPVtune</div>
    </div>
    <div class="content">
      <h2>${isZh ? '您的 PID 调参报告已准备好!' : 'Your PID Tuning Report is Ready!'}</h2>
      <p class="order-number">${isZh ? '订单号' : 'Order'}: ${orderNumber}</p>

      <div class="summary">
        <h3>${isZh ? '分析摘要' : 'Analysis Summary'}</h3>
        <p>${analysis.analysis.summary}</p>
      </div>

      <h3>${isZh ? 'CLI 命令' : 'CLI Commands'}</h3>
      <p>${isZh ? '复制以下命令到 Betaflight 配置器的 CLI 标签页：' : 'Copy the following commands into Betaflight Configurator CLI tab:'}</p>
      <div class="cli-box">${analysis.cli_commands}</div>

      <p style="margin-top: 20px;">
        ${isZh ? '完整的 PDF 报告已附在此邮件中。' : 'The complete PDF report is attached to this email.'}
      </p>

      <h3>${isZh ? '如何应用设置' : 'How to Apply'}</h3>
      <ol>
        <li>${isZh ? '通过 USB 连接飞控' : 'Connect your flight controller via USB'}</li>
        <li>${isZh ? '打开 Betaflight 配置器' : 'Open Betaflight Configurator'}</li>
        <li>${isZh ? '进入 CLI 标签页' : 'Go to the CLI tab'}</li>
        <li>${isZh ? '粘贴上述命令并按回车' : 'Paste the commands above and press Enter'}</li>
        <li>${isZh ? '输入 "save" 保存设置' : 'Type "save" to save settings'}</li>
        <li>${isZh ? '安全试飞!' : 'Test fly safely!'}</li>
      </ol>
    </div>
    <div class="footer">
      <p>FPVtune - AI-Powered Betaflight PID Tuning</p>
      <p>${isZh ? '如有问题，请联系' : 'Questions? Contact'} support@fpvtune.com</p>
    </div>
  </div>
</body>
</html>
  `;

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'FPVtune <onboarding@resend.dev>',
    to,
    subject,
    html,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `FPVtune-Report-${orderNumber}.pdf`,
      },
    ],
  });

  if (error) {
    console.error('Email send error:', error);
    throw error;
  }

  return { messageId: data?.id };
}

export async function processOrder(orderId: string): Promise<void> {
  console.log(`Processing order: ${orderId}`);

  const [order] = await db
    .select()
    .from(tuneOrder)
    .where(eq(tuneOrder.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  try {
    await db
      .update(tuneOrder)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(tuneOrder.id, orderId));

    console.log(`Running AI analysis for order ${order.orderNumber}...`);
    const analysis = await runAIAnalysis(
      '',
      order.problems || '',
      order.goals || '',
      order.flyingStyle || '',
      order.frameSize || '',
      order.additionalNotes || '',
      order.locale || 'en'
    );

    console.log(`Generating PDF for order ${order.orderNumber}...`);
    const { buffer: pdfBuffer, hash: pdfHash } = await generatePDF(
      order.orderNumber,
      order.customerEmail,
      order.createdAt,
      analysis,
      order.flyingStyle || 'freestyle',
      order.frameSize || '5'
    );

    console.log(`Sending email for order ${order.orderNumber}...`);
    const { messageId } = await sendResultEmail(
      order.customerEmail,
      order.orderNumber,
      analysis,
      pdfBuffer,
      order.locale || 'en'
    );

    await db
      .update(tuneOrder)
      .set({
        status: 'completed',
        analysisResult: analysis,
        cliCommands: analysis.cli_commands,
        pdfHash,
        emailSentAt: new Date(),
        emailMessageId: messageId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, orderId));

    console.log(`Order ${order.orderNumber} completed successfully!`);
  } catch (error) {
    console.error(`Error processing order ${order.orderNumber}:`, error);

    await db
      .update(tuneOrder)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, orderId));

    throw error;
  }
}
