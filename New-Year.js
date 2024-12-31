document.addEventListener("DOMContentLoaded", () => {
    // HTML dosyasını fetch ile çağırıyoruz
    fetch("./New-Year/12/first.html") // Dosya yolu
      .then(response => {
        if (!response.ok) {
          throw new Error("HTML dosyası yüklenemedi");
        }
        return response.text();
      })
      .then(data => {
        // HTML içeriğini, ana sayfadaki section'ı hedef alarak yerleştiriyoruz
        document.getElementById("first-section").innerHTML = data;
      })
      .catch(error => console.error("Hata:", error));
  });