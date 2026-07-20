const { jsPDF } = window.jspdf;

const compte = JSON.parse(localStorage.getItem('compte')) || {};

function afficherRecapEntreprise() {
    document.getElementById("recapNom").textContent = compte.nom || '—';
    document.getElementById("recapSiret").textContent = compte.siret || '—';
    document.getElementById("recapAdresse").textContent = compte.adresse || '—';
}
afficherRecapEntreprise();

function updateTotals() {
    const lignes = document.querySelectorAll(".produit-ligne");
    let sousTotal = 0;
    lignes.forEach(l => {
        const qte = parseFloat(l.querySelector(".produit-quantite").value) || 0;
        const prix = parseFloat(l.querySelector(".produit-prix").value) || 0;
        sousTotal += qte * prix;
    });
    const tva = sousTotal * 0.2;
    const totalTTC = sousTotal + tva;
    document.getElementById("sousTotal").textContent = sousTotal.toFixed(2);
    document.getElementById("tva").textContent = tva.toFixed(2);
    document.getElementById("totalTTC").textContent = totalTTC.toFixed(2);
}

function addProduit() {
    const container = document.getElementById("produits-container");
    const ligne = document.createElement("div");
    ligne.classList.add("produit-ligne");
    ligne.innerHTML = `
        <input type="text" class="produit-nom" placeholder="Nom de l'article" required>
        <input type="number" class="produit-quantite" placeholder="Quantité" min="1" required>
        <input type="number" class="produit-prix" placeholder="Prix unitaire (€)" min="0" step="0.01" required>
        <button type="button" class="supprimer-produit">✕</button>
    `;
    container.appendChild(ligne);
    ligne.querySelector(".supprimer-produit").addEventListener("click", () => { ligne.remove(); updateTotals(); });
    ligne.querySelector(".produit-quantite").addEventListener("input", updateTotals);
    ligne.querySelector(".produit-prix").addEventListener("input", updateTotals);
}

document.getElementById("ajouter-produit").addEventListener("click", addProduit);

document.querySelectorAll(".produit-ligne").forEach(l => {
    l.querySelector(".supprimer-produit").addEventListener("click", () => { l.remove(); updateTotals(); });
    l.querySelector(".produit-quantite").addEventListener("input", updateTotals);
    l.querySelector(".produit-prix").addEventListener("input", updateTotals);
});

updateTotals();

document.getElementById("telephone").addEventListener("input", function () {
    const val = this.value.trim();
    const erreur = document.getElementById("erreur-tel");
    const valide = /^(\+33|0)[1-9](\s?\d{2}){4}$/.test(val);
    if (val.length > 0 && !valide) {
        this.classList.add("erreur");
        erreur.style.display = "block";
    } else {
        this.classList.remove("erreur");
        erreur.style.display = "none";
    }
});

document.getElementById("btn-create").addEventListener("click", () => {
    if (!compte.nom || !/^\d{14}$/.test(compte.siret || '') || !compte.adresse) {
        alert("❌ Ton profil entreprise est incomplet (nom, SIRET ou adresse manquant). Rends-toi sur ta page profil pour le compléter.");
        window.location.href = 'profil.html';
        return;
    }

    const champsObligatoires = [
        { id: "numFacture", label: "Numéro de facture" },
        { id: "nomClient", label: "Nom du client" },
        { id: "adresseClient", label: "Adresse du client" },
        { id: "telephone", label: "Téléphone" },
        { id: "date", label: "Date" }
    ];

    for (const champ of champsObligatoires) {
        if (!document.getElementById(champ.id).value.trim()) {
            alert(`❌ Le champ "${champ.label}" est obligatoire.`);
            document.getElementById(champ.id).focus();
            return;
        }
    }

    const nomEntreprise = compte.nom;
    const siret = compte.siret;
    const adresseEntreprise = compte.adresse;

    const numFacture = document.getElementById("numFacture").value;
    const nomClient = document.getElementById("nomClient").value;
    const adresseClient = document.getElementById("adresseClient").value;
    const telephone = document.getElementById("telephone").value;
    const date = document.getElementById("date").value;
    const paiement = document.getElementById("paiement").value || "Non précisé";

    const lignes = document.querySelectorAll(".produit-ligne");
    const produits = [];
    lignes.forEach(l => {
        const nom = l.querySelector(".produit-nom").value;
        const qte = parseFloat(l.querySelector(".produit-quantite").value) || 0;
        const prix = parseFloat(l.querySelector(".produit-prix").value) || 0;
        if (nom) produits.push({ nom, qte, prix, total: qte * prix });
    });

    if (produits.length === 0) {
        alert("❌ Ajoutez au moins un article.");
        return;
    }

    const sousTotal = produits.reduce((sum, p) => sum + p.total, 0);
    const taxe = sousTotal * 0.2;
    const totalTTC = sousTotal + taxe;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 105, y, null, null, "center");
    y += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Entreprise : ${nomEntreprise}`, 20, y); y += 7;
    doc.text(`SIRET : ${siret}`, 20, y); y += 7;
    doc.text(`Adresse : ${adresseEntreprise}`, 20, y); y += 12;

    doc.text(`Client : ${nomClient}`, 20, y); y += 7;
    doc.text(`Adresse : ${adresseClient}`, 20, y); y += 7;
    doc.text(`Téléphone : ${telephone}`, 20, y); y += 7;
    doc.text(`Date : ${date}`, 20, y); y += 7;
    doc.text(`Paiement : ${paiement}`, 20, y); y += 12;

    doc.autoTable({
        startY: y,
        head: [['Article', 'Quantité', 'Prix unitaire (€)', 'Total (€)']],
        body: produits.map(p => [p.nom, p.qte, p.prix.toFixed(2), p.total.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 255], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 11 }
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFont("helvetica", "normal");
    doc.text(`Sous-total : ${sousTotal.toFixed(2)} €`, 140, finalY);
    doc.text(`TVA (20%) : ${taxe.toFixed(2)} €`, 140, finalY + 7);
    doc.setFont("helvetica", "bold");
    doc.text(`Total TTC : ${totalTTC.toFixed(2)} €`, 140, finalY + 16);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Merci pour votre confiance !", 105, finalY + 30, null, null, "center");

    doc.save(`facture_${numFacture}.pdf`);
});

function loadContent(page) {
    window.location.href = page + '.html';
}