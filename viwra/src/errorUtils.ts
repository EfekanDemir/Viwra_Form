export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return "Bilinmeyen bir hata oluştu.";

  let errorMessage = "";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error);
  }

  // Check if it's our structured JSON error from handleFirestoreError
  try {
    if (errorMessage.startsWith('{') && errorMessage.includes('"operationType"')) {
      const parsedError = JSON.parse(errorMessage);
      errorMessage = parsedError.error || "";
    }
  } catch (e) {
    // Not valid JSON, continue with string matching
  }

  // Firebase auth errors
  if (errorMessage.includes("auth/popup-blocked")) {
    return "Tarayıcınız açılır pencereleri engelliyor. Lütfen bu site için açılır pencerelere izin verin ve tekrar deneyin.";
  }
  if (errorMessage.includes("auth/user-not-found") || errorMessage.includes("auth/wrong-password") || errorMessage.includes("auth/invalid-credential")) {
    return "Giriş bilgileri hatalı. Lütfen tekrar deneyin.";
  }
  if (errorMessage.includes("auth/network-request-failed")) {
    return "Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.";
  }
  if (errorMessage.includes("auth/popup-closed-by-user")) {
    return "Giriş işlemi iptal edildi.";
  }

  // Quota & Permission errors
  if (errorMessage.includes("Quota exceeded")) {
    return "Sistem şu anda çok yoğun. Kota aşıldı, lütfen yarına kadar bekleyin.";
  }
  if (errorMessage.includes("Missing or insufficient permissions") || errorMessage.includes("PERMISSION_DENIED")) {
    return "Bu işlemi yapmak için yetkiniz bulunmuyor.";
  }
  
  // Network / Generic Firestore errors
  if (errorMessage.includes("the client is offline") || errorMessage.includes("Failed to get document because the client is offline")) {
    return "İnternet bağlantınız yok gibi görünüyor. Lütfen bağlantınızı kontrol edin.";
  }

  return "Beklenmeyen bir hata oluştu: " + errorMessage.substring(0, 50) + (errorMessage.length > 50 ? '...' : '');
}
