'use client';

import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import PriceList from '../../components/PriceList';
import Link from 'next/link';
export default function PricesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <Link href="/" className="inline-flex items-center text-pink-500 mb-4">
            <i className="ri-arrow-left-line mr-2"></i>
            Volver al Inicio
          </Link>
          
          <PriceList />
          
          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <Link href="/cakes">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-pink-300">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                    <i className="ri-cake-3-line text-pink-600 text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 mb-1">Personalizar Pastel</h3>
                    <p className="text-sm text-gray-600">Crea tu pastel ideal con nuestro configurador</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/quote">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-300">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <i className="ri-file-list-3-line text-purple-600 text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 mb-1">Solicitar Cotización</h3>
                    <p className="text-sm text-gray-600">Para diseños especiales y eventos grandes</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}