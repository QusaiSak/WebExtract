import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/fileStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const { fileName } = params;
    const { searchParams } = new URL(request.url);
    
    // Try storage-backed retrieval first (preferred: shorter URLs)
    const stored = getFile(fileName);
    if (stored && stored.contentType === 'application/pdf') {
      const base64Data = stored.content;
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${stored.fileName || fileName}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Fallback: Check for direct base64 PDF data in query params (legacy)
    const pdfData = searchParams.get('data');
    
    if (pdfData) {
      // Handle base64 PDF data directly
      const base64Data = pdfData.startsWith('data:application/pdf;base64,') 
        ? pdfData.replace('data:application/pdf;base64,', '')
        : pdfData;
      
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // No file found and no base64 provided
    return NextResponse.json(
      { error: 'No PDF file found. Provide fileId path or ?data=<base64>.' },
      { status: 404 }
    );

  } catch (error) {
    console.error('PDF download error:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF file' },
      { status: 500 }
    );
  }
}
