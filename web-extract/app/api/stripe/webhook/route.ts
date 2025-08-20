import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/stripe'
import prisma from '@/lib/prisma'
import { getCreditsPack, PackId } from '@/lib/billing'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  console.log('Webhook received, signature:', signature ? 'present' : 'missing')
  console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'present' : 'missing')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    console.log('Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout session completed:', session.id)

        // Get metadata from the session
        const { userId, packId } = session.metadata || {}

        if (!userId || !packId) {
          console.error('Missing metadata in session:', session.metadata)
          return new Response('Missing metadata', { status: 400 })
        }

        // Get the credit pack info
        const creditsPack = getCreditsPack(packId as PackId)
        if (!creditsPack) {
          console.error('Invalid pack ID:', packId)
          return new Response('Invalid pack ID', { status: 400 })
        }

        console.log(`Adding ${creditsPack.credits} credits to user ${userId}`)

        try {
          // Add credits to user balance
          await prisma.userBalance.upsert({
            where: { userId },
            update: {
              credits: { increment: creditsPack.credits }
            },
            create: {
              userId,
              credits: creditsPack.credits
            }
          })

          // Record the purchase
          await prisma.userPurchase.create({
            data: {
              id: `purchase_${Date.now()}_${userId}`,
              userId,
              stripeId: session.id,
              description: `${creditsPack.name} - ${creditsPack.label}`,
              amount: creditsPack.price,
              currency: 'INR',
              date: new Date()
            }
          })

          console.log(`Successfully processed payment for user ${userId}`)
        } catch (dbError) {
          console.error('Database error:', dbError)
          return new Response('Database error', { status: 500 })
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        console.log('Payment succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook error', { status: 400 })
  }
}
