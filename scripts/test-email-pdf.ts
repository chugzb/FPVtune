/**
 * 测试 PDF 生成和邮件发送功能
 * 不依赖数据库，直接测试核心功能
 */

import { resolve } from 'path';
import { config } from 'dotenv';

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') });

import type { AnalysisResult } from '@/types/tune';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// 模拟 AI 分析结果
const mockAnalysis: AnalysisResult = {
  analysis: {
    summary:
      "The log header shows an older PID controller (pidController:2, LuxFloat-era) on a 2 kHz loop with heavy D-term averaging and almost no modern filtering. That combination plus high-ish D on pitch is very likely to cause hot motors and dirty D-term, which then shows as propwash. We'll move you to a modern Betaflight-style tune with more appropriate filtering, lower D noise, and stronger but smooth setpoint handling for freestyle.",
    issues: [
      'Legacy PID controller (2) – no modern feedforward / setpoint tuning, which hurts propwash performance.',
      'High D-term averaging (dterm_average_count:12) – very slow D-term, delays correction and worsens propwash.',
      'No explicit gyro/D-term lowpass configuration in the header – likely relying on very old defaults.',
      'Pitch PID much higher than roll (58/50/35 vs 40/40/23) – can easily overheat motors.',
      'No dynamic notch info – suggests older filtering strategy.',
    ],
    recommendations: [
      'Switch to the current Betaflight PID controller and use feedforward.',
      'Reduce D-term values and remove heavy averaging.',
      'Balance roll and pitch P/D closer together for a 5" freestyle rig.',
      'Use dynamic notch filters to target motor band resonances.',
      'Configure relatively strong feedforward (F) for roll/pitch.',
    ],
  },
  pid: {
    roll: { p: 48, i: 60, d: 32, f: 90 },
    pitch: { p: 52, i: 65, d: 36, f: 95 },
    yaw: { p: 50, i: 60, d: 0, f: 60 },
  },
  filters: {
    gyro_lowpass_hz: 120,
    gyro_lowpass2_hz: 250,
    dterm_lowpass_hz: 80,
    dterm_lowpass2_hz: 160,
    dyn_notch_count: 2,
    dyn_notch_q: 250,
    dyn_notch_min_hz: 90,
    dyn_notch_max_hz: 350,
  },
  cli_commands: `# FPVtune Generated Settings
set pid_controller = 3

# Roll
set p_roll = 48
set i_roll = 60
set d_roll = 32
set f_roll = 90

# Pitch
set p_pitch = 52
set i_pitch = 65
set d_pitch = 36
set f_pitch = 95

# Yaw
set p_yaw = 50
set i_yaw = 60
set d_yaw = 0
set f_yaw = 60

# Filters
set gyro_lpf1_static_hz = 120
set gyro_lpf2_static_hz = 250
set dterm_lpf1_static_hz = 80
set dterm_lpf2_static_hz = 160
set dyn_notch_count = 2
set dyn_notch_q = 250
set dyn_notch_min_hz = 90
set dyn_notch_max_hz = 350

save`,
};

async function generatePDF(
  orderNumber: string,
  customerEmail: string,
  createdAt: Date,
  analysis: AnalysisResult,
  flyingStyle: string,
  frameSize: string
): Promise<Buffer> {
  console.log('Generating PDF...');

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
  const summaryLines = (analysis.analysis?.summary || '').split('\n');
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

  const cliLines = (analysis.cli_commands || '').split('\n');
  for (const line of cliLines.slice(0, 40)) {
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    addText(line.slice(0, 85), 8, false, true);
  }

  // Footer
  y = margin;
  page.drawText(
    'Generated by FPVtune.com - Neural Network-Powered Betaflight PID Tuning',
    {
      x: margin,
      y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  const pdfBytes = await pdfDoc.save();
  console.log(`✅ PDF generated (${pdfBytes.length} bytes)`);

  return Buffer.from(pdfBytes);
}

async function sendEmail(
  to: string,
  orderNumber: string,
  analysis: AnalysisResult,
  pdfBuffer: Buffer
): Promise<void> {
  console.log(`Sending email to: ${to}`);

  const subject = `[FPVtune] Your PID Tuning Report is Ready - ${orderNumber}`;

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
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FPVtune</div>
    </div>
    <div class="content">
      <h2>Your PID Tuning Report is Ready!</h2>
      <p class="order-number">Order: ${orderNumber}</p>

      <div class="summary">
        <h3>Analysis Summary</h3>
        <p>${analysis.analysis.summary}</p>
      </div>

      <h3>CLI Commands</h3>
      <p>Copy the following commands into Betaflight Configurator CLI tab:</p>
      <div class="cli-box">${analysis.cli_commands}</div>

      <p style="margin-top: 20px;">
        The complete PDF report is attached to this email.
      </p>

      <h3>How to Apply</h3>
      <ol>
        <li>Connect your flight controller via USB</li>
        <li>Open Betaflight Configurator</li>
        <li>Go to the CLI tab</li>
        <li>Paste the commands above and press Enter</li>
        <li>Type "save" to save settings</li>
        <li>Test fly safely!</li>
      </ol>
    </div>
    <div class="footer">
      <p>FPVtune - Neural Network-Powered Betaflight PID Tuning</p>
      <p>Questions? Contact support@fpvtune.com</p>
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
    console.error('❌ Email send error:', error);
    throw error;
  }

  console.log(`✅ Email sent successfully! Message ID: ${data?.id}`);
}

async function main() {
  try {
    console.log('=== FPVtune Email & PDF Test ===\n');

    const orderNumber = 'FPV-20260118-U5XGDM';
    const customerEmail = 'ningainshop@gmail.com';
    const createdAt = new Date();
    const flyingStyle = 'Freestyle';
    const frameSize = '5';

    // 1. 生成 PDF
    const pdfBuffer = await generatePDF(
      orderNumber,
      customerEmail,
      createdAt,
      mockAnalysis,
      flyingStyle,
      frameSize
    );

    // 保存 PDF 到本地用于检查
    const fs = await import('fs/promises');
    await fs.writeFile('test-report.pdf', pdfBuffer);
    console.log('📄 PDF saved to: test-report.pdf\n');

    // 2. 发送邮件
    await sendEmail(customerEmail, orderNumber, mockAnalysis, pdfBuffer);

    console.log('\n=== Test Completed Successfully ===');
    console.log(`Check your email: ${customerEmail}`);
    console.log('Check the PDF file: test-report.pdf');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
