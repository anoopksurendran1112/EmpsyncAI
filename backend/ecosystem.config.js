module.exports = {
  apps: [
    {
      name: "empsync",
      script: "gunicorn",
      args: "empsync.wsgi:application --bind 0.0.0.0:9191 --workers 4 --threads 2",
      cwd: "/var/www/django-apps/web.empsyncai/EmpSyncAI-1",
      interpreter: "python3",
      watch: false,

      // PM2 limits
      instances: 1,                // Only 1 PM2 process (Gunicorn handles workers)
      max_memory_restart: "800M",  // Restart if Django crosses 800MB RAM
      autorestart: true
    }
  ]
};
