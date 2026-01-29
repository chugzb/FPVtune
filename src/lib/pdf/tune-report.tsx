import type { AnalysisResult } from '@/types/tune';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#3b82f6',
  },
  orderInfo: {
    textAlign: 'right',
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  orderDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 10,
    color: '#1e40af',
    lineHeight: 1.5,
  },
  issueBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  issueTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#92400e',
    marginBottom: 6,
  },
  issueItem: {
    fontSize: 9,
    color: '#78350f',
    marginBottom: 3,
  },
  recommendBox: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  recommendTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#065f46',
    marginBottom: 6,
  },
  recommendItem: {
    fontSize: 9,
    color: '#047857',
    marginBottom: 3,
  },
  pidTable: {
    marginTop: 10,
  },
  pidRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pidHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 600,
  },
  pidCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    fontSize: 10,
  },
  pidAxisCell: {
    flex: 1,
    padding: 8,
    fontWeight: 600,
    backgroundColor: '#f9fafb',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  filterItem: {
    width: '50%',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterLabel: {
    color: '#6b7280',
    fontSize: 9,
  },
  filterValue: {
    fontWeight: 600,
    color: '#1f2937',
    fontSize: 9,
  },
  cliSection: {
    marginTop: 20,
  },
  cliBox: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 6,
  },
  cliText: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#e5e7eb',
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerHash: {
    fontSize: 7,
    color: '#d1d5db',
    fontFamily: 'Courier',
  },
});

interface TuneReportProps {
  orderNumber: string;
  customerEmail: string;
  createdAt: Date;
  analysis: AnalysisResult;
  flyingStyle: string;
  frameSize: string;
  pdfHash?: string;
}

export function TuneReport({
  orderNumber,
  customerEmail,
  createdAt,
  analysis,
  flyingStyle,
  frameSize,
  pdfHash,
}: TuneReportProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>FPVtune</Text>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(createdAt)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>PID Tuning Analysis Report</Text>
        <Text style={styles.subtitle}>
          Neural network-optimized Betaflight settings for {flyingStyle} flying
          on {frameSize}" frame
        </Text>

        {/* Analysis Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Summary</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{analysis.analysis.summary}</Text>
          </View>

          {/* Issues */}
          {analysis.analysis.issues && analysis.analysis.issues.length > 0 && (
            <View style={styles.issueBox}>
              <Text style={styles.issueTitle}>Issues Identified</Text>
              {analysis.analysis.issues.map((issue: string, i: number) => (
                <Text key={i} style={styles.issueItem}>
                  • {issue}
                </Text>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {analysis.analysis.recommendations &&
            analysis.analysis.recommendations.length > 0 && (
              <View style={styles.recommendBox}>
                <Text style={styles.recommendTitle}>Recommendations</Text>
                {analysis.analysis.recommendations.map(
                  (rec: string, i: number) => (
                    <Text key={i} style={styles.recommendItem}>
                      • {rec}
                    </Text>
                  )
                )}
              </View>
            )}
        </View>

        {/* PID Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optimized PID Values</Text>
          <View style={styles.pidTable}>
            <View style={[styles.pidRow, styles.pidHeader]}>
              <Text style={styles.pidCell}>Axis</Text>
              <Text style={styles.pidCell}>P</Text>
              <Text style={styles.pidCell}>I</Text>
              <Text style={styles.pidCell}>D</Text>
              <Text style={styles.pidCell}>F</Text>
            </View>
            <View style={styles.pidRow}>
              <Text style={styles.pidAxisCell}>Roll</Text>
              <Text style={styles.pidCell}>{analysis.pid.roll.p}</Text>
              <Text style={styles.pidCell}>{analysis.pid.roll.i}</Text>
              <Text style={styles.pidCell}>{analysis.pid.roll.d}</Text>
              <Text style={styles.pidCell}>{analysis.pid.roll.f}</Text>
            </View>
            <View style={styles.pidRow}>
              <Text style={styles.pidAxisCell}>Pitch</Text>
              <Text style={styles.pidCell}>{analysis.pid.pitch.p}</Text>
              <Text style={styles.pidCell}>{analysis.pid.pitch.i}</Text>
              <Text style={styles.pidCell}>{analysis.pid.pitch.d}</Text>
              <Text style={styles.pidCell}>{analysis.pid.pitch.f}</Text>
            </View>
            <View style={styles.pidRow}>
              <Text style={styles.pidAxisCell}>Yaw</Text>
              <Text style={styles.pidCell}>{analysis.pid.yaw.p}</Text>
              <Text style={styles.pidCell}>{analysis.pid.yaw.i}</Text>
              <Text style={styles.pidCell}>{analysis.pid.yaw.d}</Text>
              <Text style={styles.pidCell}>{analysis.pid.yaw.f}</Text>
            </View>
          </View>
        </View>

        {/* Filter Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Settings</Text>
          <View style={styles.filterGrid}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Gyro LPF</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.gyro_lowpass_hz} Hz
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Gyro LPF2</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.gyro_lowpass2_hz} Hz
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>D-term LPF</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.dterm_lowpass_hz} Hz
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>D-term LPF2</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.dterm_lowpass2_hz} Hz
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Dyn Notch Count</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.dyn_notch_count}
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Dyn Notch Q</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.dyn_notch_q}
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Dyn Notch Min</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.dyn_notch_min_hz} Hz
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Dyn Notch Max</Text>
              <Text style={styles.filterValue}>
                {analysis.filters.dyn_notch_max_hz} Hz
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by FPVtune AI • {customerEmail}
          </Text>
          {pdfHash && (
            <Text style={styles.footerHash}>
              Hash: {pdfHash.substring(0, 16)}...
            </Text>
          )}
        </View>
      </Page>

      {/* Page 2: CLI Commands */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>FPVtune</Text>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
            <Text style={styles.orderDate}>CLI Commands</Text>
          </View>
        </View>

        <Text style={styles.title}>Betaflight CLI Commands</Text>
        <Text style={styles.subtitle}>
          Copy and paste these commands into Betaflight Configurator CLI tab
        </Text>

        <View style={styles.cliSection}>
          <View style={styles.cliBox}>
            <Text style={styles.cliText}>{analysis.cli_commands}</Text>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>How to Apply</Text>
          <View style={styles.recommendBox}>
            <Text style={styles.recommendItem}>
              1. Connect your flight controller via USB
            </Text>
            <Text style={styles.recommendItem}>
              2. Open Betaflight Configurator
            </Text>
            <Text style={styles.recommendItem}>3. Go to the CLI tab</Text>
            <Text style={styles.recommendItem}>
              4. Copy all commands above and paste into CLI
            </Text>
            <Text style={styles.recommendItem}>5. Press Enter to execute</Text>
            <Text style={styles.recommendItem}>
              6. Type "save" and press Enter to save settings
            </Text>
            <Text style={styles.recommendItem}>
              7. Disconnect and test fly safely!
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FPVtune.com • Neural Network-Powered Betaflight PID Tuning
          </Text>
          <Text style={styles.footerText}>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  );
}
