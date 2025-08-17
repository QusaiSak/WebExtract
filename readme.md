

### Setup Instructions
Run the following in terminal
```bash
git clone https://github.com/QusaiSak/WebExtract.git
cd web-extract
npm install
```
Setup your .env file 
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

DATABASE_URL=

NEXT_PUBLIC_CLERK_SIGN_UP_URL= /sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL= /sign-in

NEXT_PUBLIC_DEV_MODE=false
API_SECRET=

ENCRYPTION_KEY = 

NEXT_PUBLIC_APP_URL=http://localhost:3000/ 
APP_URL = 


NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

STRIPE_WEBHOOK_SECRET = 


STRIPE_SMALL_PACK_PRICE_ID = 
STRIPE_MEDIUM_PACK_PRICE_ID = 
STRIPE_LARGE_PACK_PRICE_ID = 
```

Open terminal and issue:
```
npx prisma generate
npx prisma db push
npm run dev
```

Voila ;) Just type in http://localhost:3000 in your browser!



