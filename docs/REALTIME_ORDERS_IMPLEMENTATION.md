# Implémentation des Commandes en Temps Réel

## ✅ **Fonctionnalités Ajoutées**

### **1. 📊 Nouvelles Fonctions Analytics**

#### **getCurrentActiveOrders**
```javascript
// Obtient le nombre de commandes récentes dans une fenêtre de temps
export const getCurrentActiveOrders = async (timeWindowMinutes = 60) => {
  // Compte les commandes des 60 dernières minutes par défaut
  // Retourne le nombre total de commandes
}
```

#### **getActiveOrdersHistory** 
```javascript
// Obtient l'historique des commandes pour le graphique
export const getActiveOrdersHistory = async (dataPoints = 12, intervalMinutes = 5) => {
  // Récupère 12 points de données avec intervalles de 5 minutes
  // Retourne: [{ time: "14:30", orders: 3 }, ...]
}
```

#### **getRecentOrdersStats**
```javascript
// Statistiques détaillées des commandes récentes
export const getRecentOrdersStats = async (timeWindowMinutes = 60) => {
  // Retourne: { total, revenue, pending, processing, delivered }
}
```

### **2. 🔧 RealTimeChart Amélioré**

#### **Support Multi-Type**
```jsx
<RealTimeChart
  title="Commandes en temps réel"
  showOrders={true}       // Active le mode commandes
  showVisitors={false}    // Désactive le mode visiteurs
  updateInterval={60000}  // Mise à jour toutes les minutes
/>
```

#### **Couleurs Automatiques**
- **Visiteurs** : 🟢 Vert (`rgb(34, 197, 94)`)
- **Commandes** : 🟡 Orange (`rgb(245, 158, 11)`)
- **Défaut** : 🔵 Bleu (`rgb(59, 130, 246)`)

#### **Labels Dynamiques**
- **Visiteurs** : "Visiteurs actifs"
- **Commandes** : "Commandes récentes"
- **Défaut** : "Activité"

### **3. 📈 Interface Adaptative**

#### **Tooltips Intelligents**
```javascript
// Adapte le texte selon le type de données
if (showVisitors) {
  return `${value} visiteur${value > 1 ? 's' : ''}`;
} else if (showOrders) {
  return `${value} commande${value > 1 ? 's' : ''}`;
}
```

#### **Statistiques Contextuelles**
| Type | Stat 1 | Stat 2 | Stat 3 |
|------|--------|--------|--------|
| **Visiteurs** | En ligne maintenant | Moyenne/heure | Pic aujourd'hui |
| **Commandes** | Dernière heure | Moyenne/période | Pic période |

## 🚀 **Configuration dans Analytics.jsx**

### **Avant (données aléatoires)**
```jsx
<RealTimeChart
  title="Commandes en temps réel"
  data={{
    labels: Array.from({ length: 12 }, ...),
    datasets: [{
      label: 'Commandes',
      data: Array.from({ length: 12 }, () => Math.random() * 20 + 5),
      // ...
    }]
  }}
  updateInterval={3000}
/>
```

### **Après (données réelles)**
```jsx
<RealTimeChart
  title="Commandes en temps réel"
  showOrders={true}        // ✅ Données réelles
  showVisitors={false}     // ✅ Mode spécifique
  updateInterval={60000}   // ✅ Intervalle optimisé
/>
```

## 🔄 **Logique de Fonctionnement**

### **Fenêtres de Temps**
- **Visiteurs** : 5 minutes (activité récente)
- **Commandes** : 60 minutes (achats récents)
- **Historique** : 12 points × 5 minutes = 1 heure

### **Mise à Jour**
- **Visiteurs** : 30 secondes (temps réel)
- **Commandes** : 60 secondes (moins fréquent)

### **Requêtes Optimisées**
```sql
-- Commandes récentes (60 min)
SELECT id, created_at, status, total 
FROM orders 
WHERE created_at >= NOW() - INTERVAL '60 minutes'
ORDER BY created_at DESC;

-- Historique par intervalles (5 min)
SELECT COUNT(*) as orders
FROM orders 
WHERE created_at BETWEEN $timeThreshold AND $timePoint;
```

## 📊 **Types de Données Supportés**

### **1. Visiteurs Actifs**
- **Source** : `page_visits`
- **Métrique** : Sessions uniques
- **Fenêtre** : 5 minutes
- **Couleur** : 🟢 Vert

### **2. Commandes Récentes**
- **Source** : `orders`
- **Métrique** : Nombre de commandes
- **Fenêtre** : 60 minutes
- **Couleur** : 🟡 Orange

### **3. Mode Générique**
- **Source** : Données externes
- **Métrique** : Personnalisable
- **Couleur** : 🔵 Bleu

## 🎯 **Avantages de l'Implementation**

### **Performance**
- ✅ **Requêtes optimisées** avec indexes sur `created_at`
- ✅ **Mise à jour intelligente** selon le type de données
- ✅ **Caching** des résultats avec gestion d'erreurs

### **Flexibilité**
- ✅ **Composant réutilisable** pour différents types de métriques
- ✅ **Configuration simple** via props boolean
- ✅ **Extensible** pour d'autres types de données

### **Expérience Utilisateur**
- ✅ **Données réelles** au lieu de valeurs aléatoires
- ✅ **Interface cohérente** avec le reste du dashboard
- ✅ **Statistiques pertinentes** selon le contexte

## 🔧 **Utilisation**

### **Pour les Visiteurs**
```jsx
<RealTimeChart
  title="Visiteurs en temps réel"
  showVisitors={true}
  updateInterval={30000}
/>
```

### **Pour les Commandes**
```jsx
<RealTimeChart
  title="Commandes en temps réel"
  showOrders={true}
  showVisitors={false}
  updateInterval={60000}
/>
```

### **Mode Personnalisé**
```jsx
<RealTimeChart
  title="Données personnalisées"
  data={customData}
  updateInterval={10000}
/>
```

---

**Résultat** : Le dashboard Analytics affiche maintenant des **données réelles de commandes en temps réel** avec la même qualité que les statistiques de visiteurs ! 📊✨
