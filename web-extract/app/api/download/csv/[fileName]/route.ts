import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/fileStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const { fileName } = params;
    
    // Try to retrieve the stored file
    const storedFile = getFile(fileName);
    
    if (storedFile) {
      return new NextResponse(storedFile.content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${storedFile.fileName}"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // If no stored file found, generate a sample CSV for testing
    const sampleCsvData = `powerbi_id,data_source,extraction_date,chart_type,quality_score,processing_method,record_index
PBI_${Date.now()}_0,WebExtract,${new Date().toISOString()},bar,0.95,AI_Workflow,1
PBI_${Date.now()}_1,WebExtract,${new Date().toISOString()},bar,0.92,AI_Workflow,2`;

    return new NextResponse(sampleCsvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('CSV download error:', error);
    return NextResponse.json(
      { error: 'Failed to download CSV file' },
      { status: 500 }
    );
  }
}
