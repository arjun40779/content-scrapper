import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import PDFParser from 'pdf2json';

export async function POST(req: NextRequest) {
  let fileName = '';
  let parsedText = '';

  try {
    // Parse the form data
    const formData = await req.formData();
    const uploadedFile = formData.get('file'); // Retrieve the file using the key 'file'

    if (uploadedFile && uploadedFile instanceof File) {
      console.log('Uploaded file is of type File');

      // Generate a unique filename
      fileName = uuidv4();

      // Convert the uploaded file into a temporary file
      const tempFilePath = `./downloads/${fileName}.pdf`;

      // Convert ArrayBuffer to Buffer
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      // Save the buffer as a file
      await fs.writeFile(tempFilePath, fileBuffer);

      // Parse the PDF
      const pdfParser = new PDFParser(null, true);

      const parsingPromise = new Promise<string>((resolve, reject) => {
        pdfParser.on(
          'pdfParser_dataError',
          (errData: { parserError: Error }) => {
            console.error('PDF parsing error:', errData.parserError);
            reject(errData.parserError);
          }
        );

        pdfParser.on('pdfParser_dataReady', () => {
          parsedText = pdfParser.getRawTextContent();
          resolve(parsedText);
        });
      });

      await pdfParser.loadPDF(tempFilePath);
      await parsingPromise;

      console.log('Parsed Text:', parsedText);

      // Clean up the temporary file
      await fs.unlink(tempFilePath);
    } else {
      console.log('No valid file uploaded.');
      return NextResponse.json({
        error: 'Invalid file format or no file uploaded.',
      });
    }
  } catch (error) {
    console.error('Error processing the request:', error);
    return NextResponse.json({ error: 'Failed to process the file.' });
  }

  console.log('Parsed Text Ready');
  return NextResponse.json({ parsedText, fileName });
}

