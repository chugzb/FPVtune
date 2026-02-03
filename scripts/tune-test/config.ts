/**
 * FPVtune 测试配置
 */

export interface TestFileConfig {
  id: string;
  bblFile: string;
  cliFile: string;
  expectedMeta: {
    logs_found: number;
    log_used: number;
    duration_s: number;
    min_sample_rate: number;
  };
  fileSize: string;
}

// 测试文件配置
export const TEST_FILES: TestFileConfig[] = [
  {
    id: 'btfl_all',
    bblFile: 'public/test bll txt/btfl_all.bbl',
    cliFile: 'public/test bll txt/BTFL_cli_DARWINFPV_20260120_170512_DARWINF435.txt',
    expectedMeta: {
      logs_found: 5,
      log_used: 5,
      duration_s: 74.8,
      min_sample_rate: 100, // 超长飞行记录，在 500K 限制下只能达到 100Hz
    },
    fileSize: '9.8MB',
  },
  {
    id: 'crane_shadow',
    bblFile: 'public/test bll txt/BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.BBL',
    cliFile: 'public/test bll txt/BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.txt',
    expectedMeta: {
      logs_found: 2,
      log_used: 2,
      duration_s: 57.6,
      min_sample_rate: 500,
    },
    fileSize: '5.5MB',
  },
  {
    id: 'tmh7',
    bblFile: 'public/test bll txt/BTFL_cli_20260127_163654_TMH7.bbl',
    cliFile: 'public/test bll txt/BTFL_cli_20260127_163654_TMH7.txt',
    expectedMeta: {
      logs_found: 1,
      log_used: 1,
      duration_s: 51.5,
      min_sample_rate: 500,
    },
    fileSize: '4.2MB',
  },
  {
    id: 'greatmountain',
    bblFile: 'public/test bll txt/BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.bbl',
    cliFile: 'public/test bll txt/BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.txt',
    expectedMeta: {
      logs_found: 1,
      log_used: 1,
      duration_s: 42.1,
      min_sample_rate: 500,
    },
    fileSize: '2.5MB',
  },
  {
    id: 'jhef745v2',
    bblFile: 'public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL',
    cliFile: 'public/test bll txt/BTFL_cli_20260113_154510_JHEF745V2五寸竞速胶带.txt',
    expectedMeta: {
      logs_found: 1,
      log_used: 1,
      duration_s: 12.4,
      min_sample_rate: 500,
    },
    fileSize: '1.0MB',
  },
];

// 测试环境配置
export const TEST_ENV = {
  BBL_DECODER_URL: 'http://localhost:8080',
  APP_URL: 'http://localhost:3000',
  TEST_CODE: 'JB_VIP_TEST',
  API_SECRET: 'fpvtune-debug-2026',
  TIMEOUT_DECODE: 30000,
  TIMEOUT_AI: 60000,
  TIMEOUT_E2E: 90000,
  MAX_OUTPUT_CHARS: 500000,
};

// 默认用户配置
export const DEFAULT_USER_CONFIG = {
  problems: '震动, 过冲',
  goals: '更锐利的响应, 更好的锁定',
  flyingStyle: 'freestyle',
  frameSize: '5',
  testCode: TEST_ENV.TEST_CODE,
};
