// Deployment Configuration Example
// Copy this file to deployment.js and fill in your actual credentials

export default {
  ftp: {
    host: 'your-ftp-host.com',
    port: 21,
    user: 'your-username',
    password: 'your-password',
    remotePath: '/public_html',
    secure: false, // Set to true for FTPS
    timeout: 30000,
    retryAttempts: 3,
    parallelUploads: 5
  },
  build: {
    buildPath: 'dist',
    nodeEnv: 'production'
  },
  backup: {
    enabled: true,
    path: './backups'
  }
};
