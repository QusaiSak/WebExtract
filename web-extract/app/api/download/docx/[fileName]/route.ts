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
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${storedFile.fileName}"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // If no stored file found, return error
    return NextResponse.json(
      { error: 'File not found or expired' },
      { status: 404 }
    );

  } catch (error) {
    console.error('DOCX download error:', error);
    return NextResponse.json(
      { error: 'Failed to download DOCX file' },
      { status: 500 }
    );
  }
}
