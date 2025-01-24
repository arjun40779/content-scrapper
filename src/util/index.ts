import * as cheerio from 'cheerio';

export const scrapeHtml = (html: string): string => {
  const $ = cheerio.load(html);

  // Remove script tags
  $('script, img, svg').remove();

  // Remove all attributes from elements
  $('html *').each((index, element) => {
    // Type guard to ensure the node is an Element
    if (element.type === 'tag') {
      const attributes = element.attribs;
      for (const attribute in attributes) {
        $(element).removeAttr(attribute);
      }
    }
  });

  // Get the cleaned HTML
  const cleanedHtml = $.html();
  console.log('Cleaned HTML:', cleanedHtml);
  return cleanedHtml;
};

