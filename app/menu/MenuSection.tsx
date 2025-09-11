'use client';

interface MenuItem {
  name: string;
  price: string;
  description: string;
  image: string;
}

interface MenuSectionProps {
  items: MenuItem[];
}

export default function MenuSection({ items }: MenuSectionProps) {
  return (
    <div className="mb-6">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden mx-2">
            <div className="flex">
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="flex-1 p-3">
                <h3 className="font-semibold text-amber-800 text-base leading-tight">
                  {item.name}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

