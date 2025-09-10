
'use client';

export default function Contact() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">
          Contact Us
        </h2>
        <p className="text-gray-600 mb-8">
          We&apos;d love to hear from you! Get in touch for custom orders or questions.
        </p>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-left">
              <h3 className="font-semibold text-amber-800 mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-phone-line text-pink-500"></i>
                  </div>
                  <span className="ml-3 text-gray-600">(862) 233-7204</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-whatsapp-line text-green-500"></i>
                  </div>
                  <span className="ml-3 text-gray-600">+1 (201) 496-8731</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-mail-line text-pink-500"></i>
                  </div>
                  <span className="ml-3 text-gray-600">rangerbakery@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-map-pin-line text-pink-500"></i>
                  </div>
                  <span className="ml-3 text-gray-600">3657 John F. Kennedy Blvd, Jersey City, NJ 07307</span>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold text-amber-800 mb-4">Follow Us</h3>
              <div className="space-y-3">
                <a 
                  href="https://www.instagram.com/rangersbakery/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-pink-500 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-instagram-line text-pink-500"></i>
                  </div>
                  <span className="ml-3 text-gray-600">@rangersbakery</span>
                </a>
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-facebook-line text-pink-500"></i>
                  </div>
                  <span className="ml-3 text-gray-600">Ranger&apos;s Bakery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Follow us on Instagram!</h3>
          <p className="text-sm opacity-90 mb-4">
            See our latest creations and behind-the-scenes moments
          </p>
          <a 
            href="https://www.instagram.com/rangersbakery/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium !rounded-button hover:bg-white/30 transition-colors"
          >
            <i className="ri-instagram-line mr-2"></i>
            Follow @rangersbakery
          </a>
        </div>
      </div>
    </section>
  );
}
