# Guide de Typographie - Lisibilité Optimisée

## 🎯 **Objectif**
Ce guide présente les optimisations typographiques implémentées pour assurer une excellente lisibilité sur tous les appareils.

## 📱 **Polices Système Optimisées**

### Stack de polices principal (`font-sans`)
```css
font-family: 
  'system-ui',           /* Moderne */
  '-apple-system',       /* iOS/macOS */
  'BlinkMacSystemFont',  /* macOS */
  'Segoe UI',           /* Windows */
  'Roboto',             /* Android */
  'Ubuntu',             /* Linux */
  'Cantarell',          /* GNOME */
  'Noto Sans',          /* Fallback universel */
  'Helvetica Neue',     /* Fallback classique */
  'Arial',              /* Fallback final */
  sans-serif;
```

### Police Logo (`font-logo`)
```css
font-family: 'Pacifico', cursive, system-ui, sans-serif;
```

## 📐 **Tailles de Police Optimisées**

| Classe | Taille | Line Height | Letter Spacing | Usage |
|--------|--------|-------------|----------------|--------|
| `text-xs` | 12px | 1.5 | 0.025em | Labels, badges |
| `text-sm` | 14px | 1.5 | 0.025em | Texte secondaire |
| `text-base` | 16px | 1.6 | 0.015em | Texte principal |
| `text-lg` | 18px | 1.6 | 0.015em | Texte important |
| `text-xl` | 20px | 1.6 | 0.015em | Sous-titres |
| `text-2xl` | 24px | 1.5 | 0.01em | Titres secondaires |
| `text-3xl` | 30px | 1.4 | 0.01em | Titres principaux |

## 🎨 **Classes Utilitaires de Lisibilité**

### Classes de lisibilité
```html
<!-- Texte avec lisibilité optimisée -->
<p class="text-readable">Texte avec espacement optimal</p>

<!-- Texte large avec lisibilité optimisée -->
<h2 class="text-readable-large">Titre avec espacement réduit</h2>

<!-- Texte mobile-friendly -->
<span class="text-mobile-friendly">Toujours 16px minimum</span>
```

### Classes de contraste
```html
<!-- Contraste élevé (mode clair) -->
<p class="contrast-high">Texte à contraste élevé</p>

<!-- Contraste élevé (mode sombre) -->
<p class="contrast-high-dark">Texte à contraste élevé sombre</p>
```

## 📱 **Optimisations Mobile**

### Taille minimale 16px
- **Évite le zoom automatique** sur iOS Safari
- **Améliore l'expérience utilisateur** sur tous les mobiles
- **Respecte les standards d'accessibilité**

### Hauteur minimale des éléments interactifs
- **Boutons** : `min-height: 44px`
- **Inputs** : `min-height: 44px`
- **Zone de touch recommandée** : 44x44px minimum

## ♿ **Optimisations d'Accessibilité**

### Respect des préférences utilisateur
```css
/* Mouvement réduit */
@media (prefers-reduced-motion: reduce) {
  /* Animations désactivées */
}

/* Contraste élevé */
@media (prefers-contrast: high) {
  /* Contraste forcé */
}
```

### Optimisations de rendu
- `text-rendering: optimizeLegibility`
- `-webkit-font-smoothing: antialiased`
- `font-feature-settings: "liga", "clig", "kern"`

## 🎯 **Bonnes Pratiques d'Utilisation**

### ✅ **À faire**
```html
<!-- Texte principal avec lisibilité optimisée -->
<p class="text-base text-readable">Contenu principal</p>

<!-- Bouton avec taille mobile-friendly -->
<button class="btn-primary">Action</button>

<!-- Input évitant le zoom iOS -->
<input class="input" type="text" placeholder="Recherche...">
```

### ❌ **À éviter**
```html
<!-- Taille trop petite sur mobile -->
<button style="font-size: 12px;">Bouton</button>

<!-- Line-height trop serré -->
<p style="line-height: 1.2;">Texte difficile à lire</p>

<!-- Pas de fallback pour les polices -->
<h1 style="font-family: 'CustomFont';">Titre</h1>
```

## 🔧 **Variables CSS Personnalisées**

Pour une cohérence maximale, utilisez les variables définies :

```css
:root {
  --font-size-mobile-safe: 16px;
  --line-height-readable: 1.6;
  --letter-spacing-optimal: 0.015em;
  --min-touch-target: 44px;
}
```

## 📊 **Performance**

### Optimisations implémentées
- `font-display: swap` pour éviter le FOIT
- Polices système prioritaires
- Chargement optimisé de Pacifico
- Antialiasing pour les écrans haute densité

### Métriques cibles
- **WCAG AA** : Contraste minimum 4.5:1
- **Touch targets** : Minimum 44x44px
- **Font size** : Minimum 16px sur mobile
- **Line height** : 1.4-1.6 pour la lisibilité optimale

---

**Note** : Ces optimisations assurent une expérience de lecture excellente sur tous les appareils, des smartphones aux écrans haute résolution.
