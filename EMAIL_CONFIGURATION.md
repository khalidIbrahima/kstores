# Configuration SMTP pour les Notifications Email

## Vue d'ensemble

Le système de notifications email utilise maintenant **SMTP** avec vos identifiants de fournisseur email. Cette approche vous donne un contrôle total sur l'envoi d'emails sans dépendre de services externes.

## Configuration SMTP

### 1. Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration SMTP
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASSWORD=your-app-password
VITE_SMTP_SECURE=true

# Email admin
VITE_ADMIN_EMAIL=admin@kapitalstores.shop

# Optionnel: API endpoint ou webhook pour SMTP
VITE_SMTP_API_ENDPOINT=https://your-api.com/send-email
VITE_SMTP_WEBHOOK_URL=https://your-webhook.com/send-email
```

### 2. Configuration par Fournisseur

#### **Gmail**
```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASSWORD=your-app-password
VITE_SMTP_SECURE=true
```
> **Note Gmail** : Utilisez un "mot de passe d'application" au lieu de votre mot de passe principal.

#### **Outlook/Hotmail**
```env
VITE_SMTP_HOST=smtp-mail.outlook.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@outlook.com
VITE_SMTP_PASSWORD=your-password
VITE_SMTP_SECURE=true
```

#### **Yahoo**
```env
VITE_SMTP_HOST=smtp.mail.yahoo.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@yahoo.com
VITE_SMTP_PASSWORD=your-app-password
VITE_SMTP_SECURE=true
```

#### **OVH**
```env
VITE_SMTP_HOST=ssl0.ovh.net
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@yourdomain.com
VITE_SMTP_PASSWORD=your-password
VITE_SMTP_SECURE=true
```

## Implémentation Backend

### Option 1: API Endpoint (Recommandé)

Créez un endpoint backend pour gérer l'envoi SMTP :

```javascript
// Exemple avec Node.js et Nodemailer
const express = require('express');
const nodemailer = require('nodemailer');

app.post('/api/send-email', async (req, res) => {
  try {
    const { host, port, secure, auth, from, to, subject, html, text } = req.body;
    
    const transporter = nodemailer.createTransporter({
      host,
      port,
      secure,
      auth
    });
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text
    });
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Option 2: Webhook SMTP

Utilisez un service webhook comme Zapier ou IFTTT :

1. **Zapier** : Créez un webhook qui reçoit les données et envoie l'email
2. **IFTTT** : Configurez un applet pour l'envoi d'emails
3. **Service personnalisé** : Créez votre propre webhook

### Option 3: Service SMTP Direct

Modifiez directement la fonction `sendEmail` pour utiliser une bibliothèque SMTP côté client (non recommandé pour la sécurité).

## Fonctionnalités

### 1. Notifications Admin

Quand une nouvelle commande est créée, l'admin reçoit :

- **Email SMTP** avec les détails complets de la commande
- **WhatsApp** avec un résumé rapide

#### Contenu de l'email admin :
- Informations de la commande (ID, date, montant)
- Informations client (nom, email, téléphone, adresse)
- Liste des produits commandés
- Lien direct vers la page admin de la commande

### 2. Confirmations Client

Le client reçoit :

- **Email SMTP** de confirmation avec les prochaines étapes
- **WhatsApp** de confirmation (si numéro disponible)

### 3. Mises à jour de statut

Le client reçoit des emails lors des changements de statut via SMTP.

## Intégration

### 1. Dans CheckoutPage.jsx

```javascript
import { sendOrderNotificationToAdmin, sendOrderConfirmationToCustomer } from '../services/whatsappService';

// Dans handleSubmit
try {
  // Créer la commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (orderError) throw orderError;

  // Envoyer les notifications (WhatsApp + Email SMTP)
  console.log('🔄 Starting notifications for order:', order.id);
  
  // Notification à l'admin
  await sendOrderNotificationToAdmin(order);
  
  // Confirmation au client
  await sendOrderConfirmationToCustomer(order);
  
  console.log('✅ All notifications sent successfully');
} catch (error) {
  console.error('❌ Error sending notifications:', error);
  // Ne pas bloquer le processus de commande
}
```

## Tests

### 1. Test de Configuration SMTP

```javascript
import { testEmailConfiguration } from '../services/emailService';

// Tester la configuration SMTP
const testResult = await testEmailConfiguration();
if (testResult.success) {
  console.log('✅ SMTP configuration is working');
} else {
  console.error('❌ SMTP configuration failed:', testResult.error);
}
```

### 2. Interface de Test

Utilisez l'interface de test dans les paramètres admin (onglet Email) pour :
- Vérifier la configuration SMTP
- Tester l'envoi d'emails
- Voir les détails de configuration

## Dépannage SMTP

### Problèmes Courants

#### 1. "SMTP configuration incomplete"
- Vérifiez que toutes les variables SMTP sont définies
- Assurez-vous que `VITE_SMTP_HOST`, `VITE_SMTP_USER`, et `VITE_SMTP_PASSWORD` sont configurés

#### 2. "Authentication failed"
- Vérifiez vos identifiants SMTP
- Pour Gmail, utilisez un "mot de passe d'application"
- Activez l'authentification à 2 facteurs si nécessaire

#### 3. "Connection timeout"
- Vérifiez le port SMTP (587 pour TLS, 465 pour SSL)
- Vérifiez que `VITE_SMTP_SECURE` est correctement configuré
- Testez la connectivité au serveur SMTP

#### 4. "No backend configured"
- Configurez un endpoint API ou webhook
- Ou implémentez un service backend pour SMTP

### Logs de Débogage

```javascript
// Activer les logs détaillés
console.log('🔄 Starting SMTP notifications for order:', order.id);
console.log('📧 SMTP Email would be sent:', {
  host: EMAIL_CONFIG.smtpHost,
  port: EMAIL_CONFIG.smtpPort,
  user: EMAIL_CONFIG.smtpUser,
  to: to,
  subject: subject
});
console.log('✅ SMTP notification sent successfully');
```

## Sécurité

### 1. Protection des Identifiants
- Ne jamais commiter les mots de passe dans Git
- Utiliser des variables d'environnement
- Chiffrer les mots de passe sensibles

### 2. Authentification SMTP
- Utiliser des mots de passe d'application pour Gmail
- Activer l'authentification à 2 facteurs
- Limiter les permissions SMTP

### 3. Validation des Emails
- Validation côté client et serveur
- Protection contre l'injection
- Limitation du taux d'envoi

## Performance

### 1. Optimisation
- Envoi asynchrone des emails
- Gestion des erreurs sans bloquer le processus
- Retry automatique en cas d'échec

### 2. Monitoring
- Suivi des taux de livraison
- Alertes en cas d'échec
- Statistiques d'envoi

## Exemples Complets

### 1. Configuration Gmail Complète

```env
# .env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASSWORD=your-16-digit-app-password
VITE_SMTP_SECURE=true
VITE_ADMIN_EMAIL=admin@kapitalstores.shop
VITE_SMTP_API_ENDPOINT=https://your-backend.com/api/send-email
```

### 2. Backend Node.js Complet

```javascript
// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  try {
    const { host, port, secure, auth, from, to, subject, html, text } = req.body;
    
    const transporter = nodemailer.createTransporter({
      host,
      port,
      secure,
      auth
    });
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text
    });
    
    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('SMTP server running on port 3001');
});
```

## Support

Pour toute question ou problème :
- Vérifiez les logs dans la console
- Utilisez l'interface de test dans les paramètres admin
- Consultez la documentation de votre fournisseur SMTP
- Contactez le support technique 