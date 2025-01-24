'use client';

import { useState } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export default function FileProcessor() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [output, setOutput] = useState<string | unknown[][] | null>(null);
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setOutput(null);
    setError(null);
  };

  const handleScrape = async () => {
    setError(null);
    setOutput(null);

    try {
      const response = await fetch(`/api/scrap?url=${encodeURIComponent(url)}`);
      const result = await response.json();

      if (response.ok) {
        setOutput(result.data);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Something went wrong while scraping');
      console.error(err);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    try {
      switch (selectedOption) {
        case 'PDF':
          await processPdf(file);
          break;
        case 'Word':
          await processWord(file);
          break;
        case 'Excel':
          await processExcel(file);
          break;
        default:
          setError('Invalid file type for the selected option.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing the file.');
    }
  };

  const processWord = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const { value: extractedText } = await mammoth.extractRawText({
      arrayBuffer: buffer,
    });
    setOutput(extractedText);
  };

  const processExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetData = workbook.SheetNames.map((sheetName) =>
      XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    );
    setOutput(sheetData);
  };

  const processPdf = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }

    const data = await response.json();
    setOutput(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      setError('No file selected');
      return;
    }

    processFile(event.target.files[0]);
  };

  return (
    <div className="p-5 relative">
      <div className="sticky top-0 bg-white">
        <h1 className="text-2xl font-bold mb-4">File Processor</h1>
        {/* Options */}
        <div className="flex gap-4 mb-6">
          {['Web', 'Word', 'Excel', 'PDF'].map((option) => (
            <button
              key={option}
              className={`px-4 py-2 rounded border ${
                selectedOption === option
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-blue-200'
              }`}
              onClick={() => handleOptionSelect(option)}
            >
              {`Scrape Data from ${option}`}
            </button>
          ))}
        </div>

        {/* File Input */}
        {selectedOption ? (
          <div className="flex items-center justify-center">
            <div className="p-6 mb-4 bg-gray-200 rounded-lg">
              {selectedOption === 'Web' ? (
                <div className="flex items-center space-x-4 mb-4">
                  <input
                    type="text"
                    placeholder="Enter a URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={handleScrape}
                    className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Scrape
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept={
                    selectedOption === 'PDF'
                      ? '.pdf'
                      : selectedOption === 'Word'
                      ? '.doc,.docx'
                      : selectedOption === 'Excel'
                      ? '.xls,.xlsx'
                      : undefined
                  }
                  onChange={handleFileChange}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Output */}
      {selectedOption && (
        <div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {output && (
            <div className="p-4 border rounded bg-gray-100">
              <h2 className="font-bold text-lg mb-2">Extracted Data:</h2>
              {selectedOption === 'Web' && (
                <div dangerouslySetInnerHTML={{ __html: output as string }} />
              )}
              {selectedOption === 'Excel' && Array.isArray(output) && (
                <div>
                  {output.map((sheetData, index) => (
                    <div key={index} className="mb-4">
                      <h3 className="font-semibold">Sheet {index + 1}</h3>
                      <pre>{JSON.stringify(sheetData, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
              {typeof output === 'string' ? (
                <pre className="whitespace-pre-wrap overflow-x-scroll">
                  {output}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap overflow-x-scroll">
                  {JSON.stringify(output, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedOption && (
        <p className="text-gray-500">Please select an option to proceed.</p>
      )}
    </div>
  );
}

