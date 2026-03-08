import React from 'react';
import path from 'path';
import { Document, Page, View, Text, Font, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { SummaryData, BasicSummary, PlusSummary, ProSummary } from '@/engine/types';

const fontsDir = path.join(process.cwd(), 'src/assets/fonts');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontsDir, 'Inter-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(fontsDir, 'Inter-Bold.ttf'), fontWeight: 'bold' },
    { src: path.join(fontsDir, 'Inter-Italic.ttf'), fontStyle: 'italic' },
  ],
});

interface PdfOptions {
  videoTitle: string;
  summary: SummaryData;
  plan: string;
  addWatermark: boolean;
}

const red = '#dc2626';
const redLight = '#fef2f2';
const slate900 = '#0f172a';
const slate600 = '#475569';
const slate400 = '#94a3b8';
const slate100 = '#f1f5f9';
const border = '#e2e8f0';

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: slate600,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: border,
    marginBottom: 20,
  },
  logo: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: red,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: red,
    color: '#ffffff',
    fontSize: 7,
    fontFamily: 'Inter',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: slate900,
    marginBottom: 20,
    lineHeight: 1.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  sectionIcon: {
    fontSize: 10,
    marginRight: 6,
    width: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Inter',
    color: slate400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paragraph: {
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 1.7,
    color: slate900,
  },
  card: {
    backgroundColor: slate100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: border,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: slate900,
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 1.6,
    color: slate900,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: red,
    marginRight: 8,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 1.6,
    color: slate900,
  },
  numberedCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: red,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberedText: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#ffffff',
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: red,
    backgroundColor: redLight,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontStyle: 'italic',
    lineHeight: 1.6,
    color: slate900,
  },
  timeSaved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: redLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  timeSavedLabel: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: red,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeSavedValue: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: slate900,
    marginTop: 2,
  },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 50,
    fontFamily: 'Inter',
    color: '#f1f1f1',
    transform: 'rotate(-30deg)',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: slate400,
  },
});

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow} wrap={false}>
          <View style={s.numberedCircle}>
            <Text style={s.numberedText}>{i + 1}</Text>
          </View>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function BasicContent({ summary }: { summary: BasicSummary }) {
  return (
    <View>
      <SectionHeader icon="●" title="Overview" />
      <Text style={s.paragraph}>{summary.overview}</Text>
      <SectionHeader icon="●" title="Key Points" />
      <BulletList items={summary.keyPoints} />
    </View>
  );
}

function PlusContent({ summary }: { summary: PlusSummary }) {
  return (
    <View>
      <SectionHeader icon="●" title="Executive Summary" />
      <Text style={s.paragraph}>{summary.executiveSummary}</Text>

      <SectionHeader icon="●" title="Theme Breakdown" />
      {summary.themeBreakdown.map((theme, i) => (
        <View key={i} style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{theme.title}</Text>
          <Text style={s.cardContent}>{theme.content}</Text>
        </View>
      ))}

      <SectionHeader icon="●" title="Key Insights" />
      <BulletList items={summary.keyInsights} />

      <View style={s.timeSaved}>
        <View>
          <Text style={s.timeSavedLabel}>Estimated time saved</Text>
          <Text style={s.timeSavedValue}>{summary.estimatedTimeSaved}</Text>
        </View>
      </View>
    </View>
  );
}

function ProContent({ summary }: { summary: ProSummary }) {
  return (
    <View>
      <SectionHeader icon="●" title="Executive Summary" />
      <Text style={s.paragraph}>{summary.executiveSummary}</Text>

      <SectionHeader icon="●" title="Topic Breakdown" />
      {summary.topicBreakdown.map((topic, i) => (
        <View key={i} style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{topic.title}</Text>
          <Text style={s.cardContent}>{topic.content}</Text>
        </View>
      ))}

      <SectionHeader icon="●" title="Key Insights" />
      <BulletList items={summary.keyInsights} />

      <SectionHeader icon="●" title="Actionable Takeaways" />
      <NumberedList items={summary.actionableTakeaways} />

      <SectionHeader icon="●" title="Key Quotes" />
      {summary.keyQuotes.map((quote, i) => (
        <View key={i} style={s.quote} wrap={false}>
          <Text style={s.quoteText}>&ldquo;{quote}&rdquo;</Text>
        </View>
      ))}

      <View style={s.timeSaved}>
        <View>
          <Text style={s.timeSavedLabel}>Estimated time saved</Text>
          <Text style={s.timeSavedValue}>{summary.estimatedTimeSaved}</Text>
        </View>
      </View>
    </View>
  );
}

function SummaryPdf({ videoTitle, summary, plan, addWatermark }: PdfOptions) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {addWatermark && <Text style={s.watermark}>SUMLY FREE</Text>}

        <View style={s.header}>
          <Text style={s.logo}>SUMLY</Text>
          <Text style={s.badge}>{plan}</Text>
        </View>

        <Text style={s.title}>{videoTitle}</Text>

        {summary.type === 'basic' && <BasicContent summary={summary} />}
        {summary.type === 'plus' && <PlusContent summary={summary} />}
        {summary.type === 'pro' && <ProContent summary={summary} />}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated by Sumly</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateSummaryPdf(options: PdfOptions): Promise<Buffer> {
  const buffer = await renderToBuffer(<SummaryPdf {...options} />);
  return Buffer.from(buffer);
}
