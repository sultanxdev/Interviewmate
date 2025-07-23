import React, { useState } from 'react'
import { X, Check, Crown } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import axios from 'axios'

const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro_monthly')

  const plans = {
    pro_monthly: {
      name: 'Pro Monthly',
      price: 999,
      duration: 'month',
      features: [
        'Unlimited interviews',
        'Advanced AI feedback',
        'Detailed performance analytics',
        'Custom interview types',
        'Priority support',
        'Export reports'
      ]
    },
    pro_yearly: {
      name: 'Pro Yearly',
      price: 9999,
      duration: 'year',
      originalPrice: 11988,
      features: [
        'Unlimited interviews',
        'Advanced AI feedback',
        'Detailed performance analytics',
        'Custom interview types',
        'Priority support',
        'Export reports',
        '2 months free!'
      ]
    }
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      // Create order
      const orderResponse = await axios.post('/api/payment/create-order', {
        plan: selectedPlan,
        amount: plans[selectedPlan].price
      })

      const { orderId, amount, currency, key } = orderResponse.data

      // Initialize Razorpay
      const options = {
        key,
        amount,
        currency,
        name: 'InterviewMate',
        description: `${plans[selectedPlan].name} Subscription`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/api/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan
            })

            onSuccess?.(verifyResponse.data)
            onClose()
          } catch (error) {
            console.error('Payment verification failed:', error)
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com'
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error) {
      console.error('Payment initiation failed:', error)
      alert('Failed to initiate payment. Please try again.')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Plan Selection */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === key
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedPlan(key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <div className="flex items-center space-x-2">
                    {selectedPlan === key && (
                      <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">₹{plan.price}</span>
                    <span className="text-gray-500">/{plan.duration}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500">
                      <span className="line-through">₹{plan.originalPrice}</span>
                      <span className="text-green-600 ml-2">Save ₹{plan.originalPrice - plan.price}</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
          >
            {loading ? 'Processing...' : `Pay ₹${plans[selectedPlan].price}`}
          </Button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By proceeding, you agree to our Terms of Service and Privacy Policy.
            You can cancel your subscription anytime.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default PaymentModal