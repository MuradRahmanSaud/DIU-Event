/**
 * Helper to process image URLs for common storage platforms (e.g., Google Drive)
 * so that they can be directly embedded in an <img> tag without preview errors.
 */
export function getFriendlyImageUrl(url: string): string {
  if (!url) return "";
  
  // Any hash part should be stripped before URL clean up to prevent breaking the regex matches
  const [cleanUrl] = url.split('#');
  const trimmed = cleanUrl.trim();
  
  // Google Drive url formats
  if (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com")) {
    let fileId = "";
    
    // Case 1: /file/d/{FILE_ID}/view or edit
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      // Case 2: ?id={FILE_ID} or &id={FILE_ID}
      const idMatch = trimmed.match(/[?&](id|docid)=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[2]) {
        fileId = idMatch[2];
      }
    }
    
    if (fileId) {
      // lh3.googleusercontent.com/d/{FILE_ID} is the most reliable public download/view link
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  
  return trimmed;
}
