fetch("/dissipl-preview/html/footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-placeholder").innerHTML = data;
  })
  .catch((error) =>
    console.error("Erreur lors du chargement du footer:", error)
  );
