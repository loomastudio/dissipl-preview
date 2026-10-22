// profile.billing.js
export function setupBilling() {
  // Pas d’écouteur particulier ici, le chargement se fait à l’affichage
}

export function loadInvoices() {
  fetch("/api/invoices", {
    method: "GET",
    credentials: "include",
  })
    .then((r) => r.json())
    .then((invoices) => {
      const invoiceSection = document.getElementById("invoiceSection");
      const invoiceList = document.getElementById("invoiceList");
      if (!invoiceSection || !invoiceList) return;

      if (!Array.isArray(invoices) || invoices.length === 0) {
        invoiceList.innerHTML =
          "<li class='list-group-item text-center text-muted'>Aucune facture disponible.</li>";
        return;
      }

      invoiceList.innerHTML = "";
      invoices.forEach((invoice) => {
        const li = document.createElement("li");
        li.classList.add("list-group-item");

        // Consistent French date formatting for the expiry date
        let expiryFR = null;
        if (invoice.premium_end) {
          const d = new Date(String(invoice.premium_end).trim().replace(" ", "T") + (String(invoice.premium_end).length === 10 ? "T00:00:00" : ""));
          expiryFR = isNaN(d.getTime()) ? invoice.premium_end : d.toLocaleDateString("fr-FR");
        }

        // Build invoice item with description, date, amount, and optional download link
        let innerHTML = `
          <div class="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <strong>${invoice.description || 'Abonnement'}</strong><br>
              <small class="text-muted">
                📅 ${invoice.date}
                ${expiryFR ? ` | Expire: ${expiryFR}` : ''}
              </small>
            </div>
            <div class="text-right">
              <span class="badge badge-success">${invoice.amount}</span>
            `;
        if (invoice.invoice_url) {
          innerHTML += `<br>
            <a href="${invoice.invoice_url}" target="_blank" class="btn btn-outline-primary btn-sm mt-1">
              📄 Voir sur Mollie
            </a>`;
        }
        innerHTML += `
            </div>
          </div>
        `;
        li.innerHTML = innerHTML;
        invoiceList.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("❌ Erreur récupération factures :", err);
      const invoiceList = document.getElementById("invoiceList");
      if (invoiceList) {
        invoiceList.innerHTML =
          "<li class='list-group-item text-center text-danger'>Erreur de chargement des factures.</li>";
      }
    });
}
