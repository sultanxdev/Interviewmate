import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mic, Brain, BarChart3, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import Logo from '../components/Logo'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Logo className="h-10 w-10" showText={true} />
        <div className="space-x-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section with Spline Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Spline 3D Background */}
        <div className="absolute inset-0 z-0">
          <iframe 
            src="https://my.spline.design/orb-130p854WoA7kaJzbiEJIK22a/" 
            frameBorder="0" 
            width="100%" 
            height="100%"
            className="w-full h-full"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Master Your
            <span className="text-yellow-400"> Interview Skills</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
            AI-powered mock interviews with real-time feedback, smart cross-questioning, and detailed performance reports
          </p>
          <div className="space-x-4">
            <Link to="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg">
                Start Practicing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose InterviewMate?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience realistic interviews with AI that adapts to your responses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Mic className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Voice-Based Interviews</h3>
              <p className="text-gray-600">Practice with realistic voice interactions using advanced TTS and STT</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Brain className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Cross-Questions</h3>
              <p className="text-gray-600">AI generates intelligent follow-up questions based on your responses</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">Get comprehensive performance reports with actionable insights</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multiple Interview Types</h3>
              <p className="text-gray-600">HR, Technical, Managerial, and Custom interview simulations</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of job seekers who've improved their interview skills
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Sarah Chen</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Software Engineer</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                "InterviewMate helped me land my dream job at Google! The AI feedback was incredibly detailed and helped me improve my technical communication."
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Michael Rodriguez</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Product Manager</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                "The cross-questioning feature is amazing! It really simulates real interview scenarios and helped me prepare for unexpected questions."
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Aisha Patel</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Data Scientist</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                "I went from scoring 60% to 85% in just two weeks! The personalized feedback and improvement tips are game-changers."
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold text-indigo-600 mb-4">$0</div>
                <ul className="space-y-3 mb-8">
                  <li>✅ 2 interviews per day</li>
                  <li>✅ Basic performance reports</li>
                  <li>✅ All interview types</li>
                  <li>❌ PDF export</li>
                  <li>❌ Priority support</li>
                </ul>
                <Link to="/signup">
                  <Button className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </Card>

            <Card className="p-8 relative border-2 border-indigo-600">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold text-indigo-600 mb-4">$9<span className="text-lg">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li>✅ Unlimited interviews</li>
                  <li>✅ Advanced analytics</li>
                  <li>✅ PDF report export</li>
                  <li>✅ Priority GPT access</li>
                  <li>✅ Priority support</li>
                </ul>
                <Link to="/signup">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-bold mb-4">InterviewMate</div>
          <p className="text-gray-400 mb-8">Empowering job seekers with AI-powered interview practice</p>
          <div className="space-x-6">
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage