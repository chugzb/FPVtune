# BBL 数值采集清单（基于 JHEF745V2 / Betaflight 4.5.2）

> 本文**只列数值字段**。这些是 **从 BBL 文件中必须抓取的"具体数值"**，
> 只要抓齐这些，AI 就可以对该黑匣子给出**完整、工程级结论**。
>
> 不包含 CLI 文本、不包含用户补充信息、不包含解释逻辑。

---

## 0. 固件与飞控标识（必须，来自 Header）

> 这些**不是采样帧数据**，但必须从 BBL Header 中解析并提供，
> 否则 AI 无法确定固件行为差异与硬件平台。

```text
firmwareVersion        # 例如 4.5.2
firmwareRevision       # 例如 Betaflight 4.5.2 (024f8e13d)
firmwareDate           # 例如 Apr  3 2025 01:50:48
boardInformation       # 例如 JHEF JHEF745V2 / STM32F745
```

---

## 1. 时间与索引（必须）

```text
frame_index            # main frame 序号
t = frame_index * looptime_us
```

---

## 2. RC 输入（必须）

```text
rcCommand[0]    # roll
rcCommand[1]    # pitch
rcCommand[2]    # yaw
rcCommand[3]    # throttle
```

---

## 3. 目标值 Setpoint（必须）

```text
setpoint[0]     # roll
setpoint[1]     # pitch
setpoint[2]     # yaw
```

---

## 4. 陀螺仪 Gyro（必须）

```text
gyro[0]         # roll
gyro[1]         # pitch
gyro[2]         # yaw
```

（可选但推荐）
```text
gyroUnfilt[0]
gyroUnfilt[1]
gyroUnfilt[2]
```

---

## 5. PID 内部量（强制必须，核心）

```text
axisP[0]        # roll P
axisI[0]        # roll I
axisD[0]        # roll D
axisF[0]        # roll F

axisP[1]        # pitch P
axisI[1]        # pitch I
axisD[1]        # pitch D
axisF[1]        # pitch F
```

（yaw PID 可选，不影响主体诊断）

---

## 6. 电机输出（必须）

```text
motor[0]        # m1
motor[1]        # m2
motor[2]        # m3
motor[3]        # m4
```

---

## 7. RPM（该 BBL **必须抓**）

> 该日志启用了 `dshot_bidir = 1`

```text
eRPM[0]         # m1
eRPM[1]         # m2
eRPM[2]         # m3
eRPM[3]         # m4
```

---

## 8. 电源与负载（必须）

```text
vbatLatest      # 电池电压
amperageLatest  # 电流
```

---

## 9. 飞行状态 / 安全（必须）

```text
armed
flightModeFlags
failsafePhase
rxSignalReceived
rxFlightChannelsValid
```

---

## 10. 可选但不影响结论的数值（可忽略）

```text
accSmooth[*]
heading[*]
axisError[*]
axisSum[*]
debug[*]
```

---

## 11. 最小完整结论集（只抓这些也可以）

```text
frame_index
rcCommand[3]            # throttle
setpoint[0..1]
gyro[0..1]
axisP/I/D/F[0..1]
motor[0..3]
vbatLatest
amperageLatest
armed
```

---

## 结论

> **这份 BBL 的结论能力 = 你是否抓齐以上数值字段**。
>
> 日志质量是高的，
> 不完整结论只会来自"数值抓取不全"。

---

# 附录：BBL Header / CLI 字段取舍清单（结论导向）

> 本附录基于 **JHEF745V2 / Betaflight 4.5.2**，
> 按"是否影响最终诊断结论"对 **BBL Header / CLI 字段**进行分级。
>
> 目标：**告诉系统从 BBL Header 里到底要抓哪些，哪些可以不抓**。

---

## A. 必须提供（缺失将导致结论不成立）

### A1. 固件与硬件标识

```text
firmwareType
firmware
firmwarePatch
firmwareVersion
Firmware revision
Firmware date
Board information
```

### A2. 时间与循环结构

```text
looptime
gyro_sync_denom
pid_process_denom
frameIntervalI
frameIntervalPNum
frameIntervalPDenom
```

### A3. 单位与标定（数值解释基础）

```text
gyroScale
acc_1G
vbatscale
vbatref
currentMeterOffset
currentMeterScale
```

### A4. 动力系统核心约束

```text
minthrottle
maxthrottle
motorOutput
motor_output_limit
throttle_limit_type
throttle_limit_percent
digitalIdleOffset
dshot_bidir
motor_poles
```

---

## B. 强烈建议提供（直接影响诊断精度）

### B1. PID 主参数

```text
rollPID
pitchPID
yawPID
pidSumLimit
pidSumLimitYaw
pidAtMinThrottle
```

### B2. D-term 与抖动控制

```text
d_max_gain
d_max_advance
dterm_filter_type
dterm_lpf_hz
dterm_lpf_dyn_hz
dterm_lpf_dyn_expo
dterm_filter2_type
dterm_lpf2_hz
dterm_notch_hz
dterm_notch_cutoff
yaw_lpf_hz
```

### B3. Gyro / RPM / 共振抑制

```text
gyro_lpf
gyro_soft_type
gyro_lowpass_hz
gyro_lowpass_dyn_hz
gyro_lowpass_dyn_expo
gyro_soft2_type
gyro_lowpass2_hz
gyro_notch_hz
gyro_notch_cutoff
gyro_rpm_notch_harmonics
gyro_rpm_notch_q
gyro_rpm_notch_min
rpm_filter_fade_range_hz
rpm_notch_lpf
dyn_notch_count
dyn_notch_min_hz
dyn_notch_max_hz
dyn_notch_q
```

---

## C. 有用但不决定结论（可选）

### C1. RC 手感与曲线

```text
thrMid
thrExpo
rc_rates
rc_expo
rates
rate_limits
rates_type
deadband
yaw_deadband
```

### C2. 稳定性与平顺性辅助

```text
itermWindupPointPercent
iterm_relax
iterm_relax_type
iterm_relax_cutoff
anti_gravity_gain
anti_gravity_cutoff_hz
anti_gravity_p_gain
abs_control_gain
use_integrated_yaw
```

### C3. Feedforward 细节

```text
ff_transition
ff_averaging
ff_smooth_factor
ff_jitter_factor
ff_boost
ff_max_rate_limit
yawRateAccelLimit
rateAccelLimit
```

---

## D. 低优先级但**仍纳入分析上下文**（建议一并提供）

```text
Craft name
Log start datetime
mixer_type
levelPID
magPID
acc_lpf_hz
acc_hardware
baro_hardware
gyro_cal_on_first_arm
airmode_activate_throttle
serialrx_provider
unsynced_fast_pwm
fast_pwm_protocol
motor_pwm_rate
features
fields_disabled_mask
blackbox_high_resolution
vbat_sag_compensation
dynamic_idle_min_rpm
dyn_idle_p_gain
dyn_idle_i_gain
dyn_idle_d_gain
dyn_idle_max_increase
dyn_idle_start_increase
rc_smoothing_mode
rc_smoothing_auto_factor_setpoint
rc_smoothing_auto_factor_throttle
rc_smoothing_feedforward_hz
rc_smoothing_setpoint_hz
rc_smoothing_throttle_hz
rc_smoothing_debug_axis
rc_smoothing_active_cutoffs_ff_sp_thr
rc_smoothing_rx_smoothed
simplified_pids_mode
simplified_master_multiplier
simplified_i_gain
simplified_d_gain
simplified_pi_gain
simplified_d_max_gain
simplified_feedforward_gain
simplified_pitch_d_gain
simplified_pitch_pi_gain
simplified_dterm_filter
simplified_dterm_filter_multiplier
simplified_gyro_filter
simplified_gyro_filter_multiplier
throttle_boost
throttle_boost_cutoff
thrust_linear
```

---

## 使用策略说明

- **A 类字段**：没有就无法诊断
- **B 类字段**：决定诊断是否准确
- **C 类字段**：用于修正手感、控制体验相关判断
- **D 类字段**：不单独决定结论，但可用于交叉验证、排除误判、增强上下文一致性

> 实际系统中，**建议 A+B+C+D 全量提供**，由分析层决定权重。

---

## 最终结论（规则化）

```text
完整诊断结论 =
  A 类 Header 字段
+ B 类 Header 字段
+ BBL 帧数据（gyro / rc / setpoint / pid / motor / rpm / power）
```

> 只要 **A + B** 类 Header 完整，其余字段缺失不会导致结论失效。
