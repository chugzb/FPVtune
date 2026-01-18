export interface AnalysisResult {
  analysis: {
    summary: string;
    issues: string[];
    recommendations: string[];
  };
  pid: {
    roll: { p: number; i: number; d: number; f: number };
    pitch: { p: number; i: number; d: number; f: number };
    yaw: { p: number; i: number; d: number; f: number };
  };
  filters: {
    gyro_lowpass_hz: number;
    gyro_lowpass2_hz: number;
    dterm_lowpass_hz: number;
    dterm_lowpass2_hz: number;
    dyn_notch_count: number;
    dyn_notch_q: number;
    dyn_notch_min_hz: number;
    dyn_notch_max_hz: number;
  };
  other: {
    dshot_bidir: boolean;
    motor_output_limit: number;
    throttle_boost: number;
    anti_gravity_gain: number;
  };
  cli_commands: string;
}

export interface TuneOrderData {
  id: string;
  orderNumber: string;
  customerEmail: string;
  locale: string;
  blackboxFilename: string | null;
  blackboxFileSize: number | null;
  problems: string | null;
  goals: string | null;
  flyingStyle: string | null;
  frameSize: string | null;
  additionalNotes: string | null;
  analysisResult: AnalysisResult | null;
  cliCommands: string | null;
  pdfUrl: string | null;
  pdfHash: string | null;
  status: string;
  amount: number | null;
  currency: string | null;
  createdAt: Date;
  paidAt: Date | null;
  completedAt: Date | null;
}
