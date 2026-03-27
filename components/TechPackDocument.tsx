import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { TechPackAsset, TechPackSection, SizingRow, CostingRow, PlacementPin, BOMRow } from '../types';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 5,
  },
  heroImage: {
    width: '100%',
    height: 400,
    objectFit: 'contain',
    marginBottom: 20,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 4,
  },
  metadataItem: {
    width: '50%',
    marginBottom: 10,
  },
  metadataLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailsColumn: {
    width: '50%',
    paddingRight: 10,
  },
  detailItem: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    color: '#0F172A',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableCell: {
    fontSize: 10,
    color: '#0F172A',
  },
  baseSizeCol: {
    backgroundColor: '#F1F5F9',
  },
  placementContainer: {
    position: 'relative',
    width: '100%',
    height: 400,
    marginBottom: 20,
  },
  placementImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  pin: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    transform: 'translate(-10px, -10px)',
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noteItem: {
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  noteText: {
    fontSize: 10,
    color: '#475569',
  },
  refGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  refImageContainer: {
    width: '48%',
    height: 250,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 5,
  },
  refImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  grandTotalRow: {
    backgroundColor: '#F8FAFC',
  },
  grandTotalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'right',
  }
});

export interface ExportConfig {
  styleName: string;
  styleNumber: string;
  season: string;
  designerName: string;
  includeCover: boolean;
  includeDetails: boolean;
  includeBom: boolean;
  includeSizing: boolean;
  includeCosting: boolean;
  includePlacement: boolean;
  includeRefs: boolean;
}

interface TechPackDocumentProps {
  techPack: TechPackAsset;
  sections: TechPackSection[];
  sizingData: SizingRow[];
  costingData: CostingRow[];
  placementData: PlacementPin[];
  bomData: BOMRow[];
  config: ExportConfig;
}

const Header = ({ styleName, styleNumber }: { styleName: string, styleNumber: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerText}>{styleName}</Text>
    <Text style={styles.headerText}>STYLE #: {styleNumber}</Text>
  </View>
);

const Footer = () => {
  const date = new Date().toLocaleDateString();
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Generated on {date}</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} />
    </View>
  );
};

export const TechPackDocument: React.FC<TechPackDocumentProps> = ({ techPack, sections, sizingData, costingData, placementData, bomData, config }) => {
  return (
    <Document>
      {/* Page 1: Cover */}
      {config.includeCover && (
        <Page size="A4" style={styles.page}>
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>{config.styleName}</Text>
          <Text style={styles.subtitle}>Technical Specification Pack</Text>
          
          <Image src={techPack.src} style={styles.heroImage} />
          
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Style Number</Text>
              <Text style={styles.metadataValue}>{config.styleNumber}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Season</Text>
              <Text style={styles.metadataValue}>{config.season || 'N/A'}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Designer</Text>
              <Text style={styles.metadataValue}>{config.designerName || 'N/A'}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Date</Text>
              <Text style={styles.metadataValue}>{new Date().toLocaleDateString()}</Text>
            </View>
          </View>
          <Footer />
        </Page>
      )}

      {/* Page 2: Technical Details */}
      {config.includeDetails && sections.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>Technical Details</Text>
          
          {sections.map((section, idx) => (
            <View key={idx} wrap={false}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.detailsGrid}>
                {section.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.detailsColumn}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Footer />
        </Page>
      )}

      {/* Page 3: Bill of Materials */}
      {config.includeBom && bomData && bomData.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>Bill of Materials</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCellHeader}>Placement</Text></View>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCellHeader}>Component</Text></View>
              <View style={[styles.tableCol, { width: '25%' }]}><Text style={styles.tableCellHeader}>Description</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCellHeader}>Color</Text></View>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCellHeader}>Supplier</Text></View>
            </View>
            
            {bomData.map((row, idx) => (
              <View key={idx} style={styles.tableRow} wrap={false}>
                <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCell}>{row.placement}</Text></View>
                <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCell}>{row.component}</Text></View>
                <View style={[styles.tableCol, { width: '25%' }]}><Text style={styles.tableCell}>{row.description}</Text></View>
                <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.color}</Text></View>
                <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCell}>{row.supplier}</Text></View>
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      )}

      {/* Page 4: Costing */}
      {config.includeCosting && costingData && costingData.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>Costing Sheet</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCellHeader}>Material Name</Text></View>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCellHeader}>Consumption</Text></View>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCellHeader}>Unit</Text></View>
              <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCellHeader}>Cost/Unit</Text></View>
              <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCellHeader}>Total</Text></View>
            </View>
            
            {costingData.map((row, idx) => (
              <View key={idx} style={styles.tableRow} wrap={false}>
                <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{row.materialName}</Text></View>
                <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCell}>{row.consumption}</Text></View>
                <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCell}>{row.unit}</Text></View>
                <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>£{row.costPerUnit.toFixed(2)}</Text></View>
                <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>£{(row.consumption * row.costPerUnit).toFixed(2)}</Text></View>
              </View>
            ))}
            
            <View style={[styles.tableRow, styles.grandTotalRow]} wrap={false}>
              <View style={[styles.tableCol, { width: '80%' }]}><Text style={styles.grandTotalText}>Estimated Garment Cost</Text></View>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={[styles.grandTotalText, { color: '#10B981' }]}>£{costingData.reduce((sum, row) => sum + (row.consumption * row.costPerUnit), 0).toFixed(2)}</Text></View>
            </View>
          </View>
          <Footer />
        </Page>
      )}

      {/* Page 4: Sizing */}
      {config.includeSizing && sizingData.length > 0 && (
        <Page size="A4" style={styles.page} orientation="landscape">
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>Sizing & Grading Matrix</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, { width: '28%' }]}><Text style={styles.tableCellHeader}>Point of Measure</Text></View>
              <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCellHeader}>XS</Text></View>
              <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCellHeader}>S</Text></View>
              <View style={[styles.tableCol, { width: '12%', backgroundColor: '#E2E8F0' }]}><Text style={styles.tableCellHeader}>M (Base)</Text></View>
              <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCellHeader}>L</Text></View>
              <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCellHeader}>XL</Text></View>
              <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCellHeader}>XXL</Text></View>
            </View>
            
            {sizingData.map((row, idx) => (
              <View key={idx} style={styles.tableRow} wrap={false}>
                <View style={[styles.tableCol, { width: '28%' }]}><Text style={styles.tableCell}>{row.pointOfMeasure}</Text></View>
                <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCell}>{row.xs}</Text></View>
                <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCell}>{row.s}</Text></View>
                <View style={[styles.tableCol, { width: '12%', backgroundColor: '#F8FAFC' }]}><Text style={styles.tableCell}>{row.m}</Text></View>
                <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCell}>{row.l}</Text></View>
                <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCell}>{row.xl}</Text></View>
                <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tableCell}>{row.xxl}</Text></View>
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      )}

      {/* Page 5: Placement Guide */}
      {config.includePlacement && placementData.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>Placement & Construction Guide</Text>
          
          <View style={styles.placementContainer}>
            <Image src={techPack.src} style={styles.placementImage} />
            {placementData.map((pin) => (
              <View key={pin.id} style={[styles.pin, { left: `${pin.x}%`, top: `${pin.y}%` }]}>
                <Text style={styles.pinText}>{pin.pinNumber}</Text>
              </View>
            ))}
          </View>

          <View>
            {placementData.map((pin) => (
              <View key={pin.id} style={styles.noteItem} wrap={false}>
                <Text style={styles.noteTitle}>{pin.pinNumber}. {pin.title}</Text>
                <Text style={styles.noteText}>{pin.note}</Text>
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      )}

      {/* Page 6: Reference Angles */}
      {config.includeRefs && techPack.additionalSources && techPack.additionalSources.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header styleName={config.styleName} styleNumber={config.styleNumber} />
          <Text style={styles.title}>Reference Angles</Text>
          
          <View style={styles.refGrid}>
            {techPack.additionalSources.map((source, idx) => (
              <View key={idx} style={styles.refImageContainer} wrap={false}>
                <Image src={`data:${source.mimeType};base64,${source.data}`} style={styles.refImage} />
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      )}
    </Document>
  );
};
