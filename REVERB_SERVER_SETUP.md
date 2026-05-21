# Laravel Reverb Server Setup

Use this when deploying realtime notifications on the Ubuntu server.

## 1. Required Packages

Reverb uses the Pusher protocol, so the PHP Pusher package must be installed:

```bash
composer require pusher/pusher-php-server
composer install --no-dev --optimize-autoloader
```

## 2. Production `.env`

Replace `your-domain.com` with the real domain.

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database

REVERB_APP_ID=school-system
REVERB_APP_KEY=school-system-key
REVERB_APP_SECRET=school-system-secret

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=your-domain.com
REVERB_PORT=443
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

After changing `.env`:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

## 3. Supervisor

Install Supervisor:

```bash
sudo apt update
sudo apt install supervisor -y
sudo mkdir -p /etc/supervisor/conf.d
```

Create the config:

```bash
sudo nano /etc/supervisor/conf.d/school-system.conf
```

Paste:

```ini
[program:school-queue]
process_name=%(program_name)s
command=php /var/www/html/School-System/artisan queue:work --sleep=3 --tries=3 --timeout=90
directory=/var/www/html/School-System
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/html/School-System/storage/logs/queue.log
stopwaitsecs=90

[program:school-reverb]
process_name=%(program_name)s
command=php /var/www/html/School-System/artisan reverb:start --host=0.0.0.0 --port=8080
directory=/var/www/html/School-System
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/html/School-System/storage/logs/reverb.log
stopwaitsecs=60
```

Save in nano:

```text
Ctrl + O
Enter
Ctrl + X
```

Apply Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start school-queue
sudo supervisorctl start school-reverb
sudo supervisorctl status
```

Expected:

```text
school-queue      RUNNING
school-reverb     RUNNING
```

## 4. Nginx WebSocket Proxy

Add this inside the HTTPS server block:

```nginx
location /app {
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Scheme $scheme;
    proxy_set_header SERVER_PORT $server_port;
    proxy_set_header REMOTE_ADDR $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_pass http://127.0.0.1:8080;
}

location /apps {
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Scheme $scheme;
    proxy_set_header SERVER_PORT $server_port;
    proxy_set_header REMOTE_ADDR $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:8080;
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. After Each Deploy

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan queue:restart
php artisan reverb:restart
sudo supervisorctl restart school-queue school-reverb
```

## 6. Test

1. Login as a student in one browser.
2. Login as a teacher/admin in another browser.
3. Create homework or a lesson plan.
4. The student notification bell should update without refresh.

If it does not work, check:

```bash
sudo supervisorctl status
tail -f storage/logs/queue.log
tail -f storage/logs/reverb.log
tail -f storage/logs/laravel.log
```
