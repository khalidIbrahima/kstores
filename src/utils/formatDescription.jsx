// Fonction pour formater la description avec respect des paragraphes
export const formatDescription = (description, options = {}) => {
  if (!description) return '';
  
  const { 
    maxLength = null, // Longueur maximale pour tronquer
    showAllParagraphs = false, // Afficher tous les paragraphes ou juste le premier
    className = "mb-3 last:mb-0" // Classe CSS pour les paragraphes
  } = options;
  
  // Diviser par les sauts de ligne
  const paragraphs = description.split('\n').map(p => p.trim()).filter(p => p);
  
  if (showAllParagraphs) {
    // Afficher tous les paragraphes avec formatage HTML
    return paragraphs.map((paragraph, index) => {
      return <p key={index} className={className}>{paragraph}</p>;
    });
  } else {
    // Prendre seulement le premier paragraphe
    const firstParagraph = paragraphs[0] || '';
    
    if (maxLength && firstParagraph.length > maxLength) {
      return firstParagraph.substring(0, maxLength) + '...';
    }
    
    return firstParagraph;
  }
};

// Fonction spécifique pour les cartes de produits (premier paragraphe tronqué)
export const formatDescriptionForCard = (description, maxLength = 100) => {
  return formatDescription(description, { maxLength });
};

// Fonction spécifique pour l'affichage complet (tous les paragraphes)
export const formatDescriptionFull = (description) => {
  return formatDescription(description, { showAllParagraphs: true });
}; 