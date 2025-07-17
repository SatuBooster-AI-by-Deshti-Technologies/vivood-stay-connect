import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  MapPin, 
  Star, 
  Wifi, 
  Coffee, 
  Car, 
  Shield, 
  Home, 
  Users, 
  Clock, 
  Phone,
  Globe,
  Mountain,
  TreePine,
  Utensils,
  Bath,
  Crown,
  Camera,
  Fish,
  Target,
  Waves
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Language = 'kz' | 'ru' | 'en';

const translations = {
  kz: {
    hero: {
      title: "Vivood Tau",
      subtitle: "Türkіstan oblysyndağy eň bііk demаlys orny. Sаіrаm şyňy - 4236 m",
      bookNow: "Қазір брондау"
    },
    booking: {
      title: "Брондау",
      description: "Нысанды толтырыңыз, біз сізбен байланысамыз",
      name: "Аты-жөні",
      phone: "Телефон",
      checkIn: "Кіру күні",
      checkOut: "Шығу күні",
      checkInTime: "Кіру уақыты",
      checkOutTime: "Шығу уақыты",
      roomType: "Үй түрі",
      confirm: "Брондауды растау",
      submitting: "Жіберілуде...",
      thanks: "Өтінішіңіз үшін рахмет!",
      contact: "Жақын арада сізбен байланысамыз"
    },
    rooms: {
      title: "Үй түрлері",
      glamping: "Глэмпинг (дөңгелек домик)",
      square: "Квадрат домик",
      vip: "VIP Капсула кинотеатрмен",
      yurt: "Юрта",
      tapshan: "Тапшан",
      workdays: "Жұмыс күндері",
      weekends: "Демалыс күндері",
      includes: "Таңғы ас кіреді",
      shower: "Душ, дәретхана бар",
      extra: "Қосымша ересек",
      child: "Бала",
      dayRate: "Күндіз",
      fullDay: "Тәулік",
      people: "адамға"
    },
    features: {
      title: "Неліктен бізді таңдайды",
      location: "Бірегей орналасу",
      locationDesc: "Сайрам-Үгем Ұлттық паркінің ішінде, панорамалық көрініс",
      service: "Премиум қызмет",
      serviceDesc: "Жеке көзқарас және жоғары деңгейдегі қызмет көрсету",
      safety: "Қауіпсіздік",
      safetyDesc: "Қорғалған аумақ, медициналық көмек, сақтандыру"
    },
    amenities: {
      title: "Қызметтер",
      wifi: "Wi-Fi",
      breakfast: "Таңғы ас",
      parking: "Көлік тұрағы",
      schedule: "Тәулік бойы",
      cauldron: "Қазан, ошақ",
      mangal: "Мангал",
      horseback: "Атпен серуендеу",
      archery: "Садақ ату",
      banya: "Баня",
      koumiss: "Қымыз",
      trout: "Форель",
      spring: "Бұлақ суы"
    },
    location: {
      title: "Орналасу",
      address: "Каскелден жоғары, Сайрам-Үгем Ұлттық паркі",
      distance: "Шымкенттен 80 км",
      altitude: "Елдегі ең биік демалыс орны",
      view: "Сайрам шыңына (4236 м) панорамалық көрініс",
      transfer: "Трансфер қызметі бар"
    },
    cta: {
      title: "Ұмытылмас демалысқа дайынсыз ба?",
      subtitle: "Vivood Tau-да демалысыңызды қазір брондаңыз",
      book: "Брондау"
    },
    footer: {
      description: "Шымкент таулары глэмпингі",
      rights: "Барлық құқықтар қорғалған"
    }
  },
  ru: {
    hero: {
      title: "Vivood Tau",
      subtitle: "Самое высокое место отдыха в Туркестанской области. Панорамный вид на пик Сайрам - 4236 м",
      bookNow: "Забронировать сейчас"
    },
    booking: {
      title: "Бронирование",
      description: "Заполните форму и мы свяжемся с вами для подтверждения",
      name: "ФИО",
      phone: "Телефон",
      checkIn: "Дата заезда",
      checkOut: "Дата выезда",
      checkInTime: "Время заезда",
      checkOutTime: "Время выезда",
      roomType: "Тип домика",
      confirm: "Подтвердить бронь",
      submitting: "Отправляем...",
      thanks: "Спасибо за заявку!",
      contact: "Мы свяжемся с вами в ближайшее время"
    },
    rooms: {
      title: "Типы домиков",
      glamping: "Глэмпинг (круглый домик)",
      square: "Квадратный домик",
      vip: "VIP Капсула с кинотеатром",
      yurt: "Юрта",
      tapshan: "Тапшан",
      workdays: "Рабочие дни",
      weekends: "Выходные",
      includes: "Завтрак включен",
      shower: "Душ, туалет",
      extra: "Доп. взрослый",
      child: "Ребенок",
      dayRate: "Дневной тариф",
      fullDay: "Сутки",
      people: "для человек"
    },
    features: {
      title: "Почему выбирают нас",
      location: "Уникальное расположение",
      locationDesc: "В Сайрам-Угамском Национальном парке с панорамным видом",
      service: "Премиум сервис",
      serviceDesc: "Индивидуальный подход и высокий уровень обслуживания",
      safety: "Безопасность",
      safetyDesc: "Охраняемая территория, медицинская помощь, страхование"
    },
    amenities: {
      title: "Удобства",
      wifi: "Wi-Fi",
      breakfast: "Завтрак",
      parking: "Парковка",
      schedule: "Круглосуточно",
      cauldron: "Казан, очаг",
      mangal: "Мангал",
      horseback: "Конные прогулки",
      archery: "Стрельба из лука",
      banya: "Баня",
      koumiss: "Кумыс",
      trout: "Форель",
      spring: "Родниковая вода"
    },
    location: {
      title: "Расположение",
      address: "Выше Каскелена, Сайрам-Угамский Национальный парк",
      distance: "80 км от Шымкента",
      altitude: "Самое высокое место отдыха в области",
      view: "Панорамный вид на пик Сайрам (4236 м)",
      transfer: "Трансфер доступен"
    },
    cta: {
      title: "Готовы к незабываемому отдыху?",
      subtitle: "Забронируйте свой отдых в Vivood Tau прямо сейчас",
      book: "Забронировать"
    },
    footer: {
      description: "Глэмпинг в горах Шымкента",
      rights: "Все права защищены"
    }
  },
  en: {
    hero: {
      title: "Vivood Tau",
      subtitle: "The highest recreation place in Turkestan region. Panoramic view of Sairam peak - 4236 m",
      bookNow: "Book Now"
    },
    booking: {
      title: "Booking",
      description: "Fill out the form and we will contact you for confirmation",
      name: "Full Name",
      phone: "Phone",
      checkIn: "Check-in Date",
      checkOut: "Check-out Date",
      checkInTime: "Check-in Time",
      checkOutTime: "Check-out Time",
      roomType: "Room Type",
      confirm: "Confirm Booking",
      submitting: "Submitting...",
      thanks: "Thank you for your request!",
      contact: "We will contact you shortly"
    },
    rooms: {
      title: "Room Types",
      glamping: "Glamping (Round House)",
      square: "Square House",
      vip: "VIP Capsule with Cinema",
      yurt: "Yurt",
      tapshan: "Tapshan",
      workdays: "Weekdays",
      weekends: "Weekends",
      includes: "Breakfast included",
      shower: "Shower, toilet",
      extra: "Extra adult",
      child: "Child",
      dayRate: "Day rate",
      fullDay: "Full day",
      people: "for people"
    },
    features: {
      title: "Why Choose Us",
      location: "Unique Location",
      locationDesc: "In Sairam-Ugam National Park with panoramic views",
      service: "Premium Service",
      serviceDesc: "Individual approach and high level of service",
      safety: "Safety",
      safetyDesc: "Secure territory, medical assistance, insurance"
    },
    amenities: {
      title: "Amenities",
      wifi: "Wi-Fi",
      breakfast: "Breakfast",
      parking: "Parking",
      schedule: "24/7",
      cauldron: "Cauldron, hearth",
      mangal: "Mangal",
      horseback: "Horseback riding",
      archery: "Archery",
      banya: "Banya",
      koumiss: "Koumiss",
      trout: "Trout",
      spring: "Spring water"
    },
    location: {
      title: "Location",
      address: "Above Kaskelen, Sairam-Ugam National Park",
      distance: "80 km from Shymkent",
      altitude: "Highest recreation place in the region",
      view: "Panoramic view of Sairam peak (4236 m)",
      transfer: "Transfer available"
    },
    cta: {
      title: "Ready for an unforgettable vacation?",
      subtitle: "Book your stay at Vivood Tau right now",
      book: "Book Now"
    },
    footer: {
      description: "Glamping in Shymkent mountains",
      rights: "All rights reserved"
    }
  }
};

const roomTypes = [
  { id: 'glamping', workday: 50000, weekend: 60000, capacity: '2+2', extras: true },
  { id: 'square', workday: 35000, weekend: 40000, capacity: '2', extras: false },
  { id: 'vip', workday: 100000, weekend: 120000, capacity: '2', extras: false },
  { id: 'yurt', workday: 30000, weekend: 50000, capacity: 'группа', extras: false },
  { id: 'tapshan', workday: 15000, weekend: 15000, capacity: '1', extras: false }
];

const Index = () => {
  const [language, setLanguage] = useState<Language>('ru');
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    roomType: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Симуляция отправки данных
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: t.booking.thanks,
      description: t.booking.contact,
    });
    
    setIsSubmitting(false);
    setIsDialogOpen(false);
    setBookingData({
      name: "",
      phone: "",
      checkIn: "",
      checkOut: "",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      roomType: ""
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Language Selector */}
      <div className="fixed top-4 right-4 z-50">
        <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
          <SelectTrigger className="w-20">
            <Globe className="w-4 h-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kz">ҚАЗ</SelectItem>
            <SelectItem value="ru">РУС</SelectItem>
            <SelectItem value="en">ENG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <Mountain className="absolute top-20 left-10 w-32 h-32 text-primary/20 animate-pulse" />
        <TreePine className="absolute bottom-20 right-10 w-24 h-24 text-primary/20 animate-pulse" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground animate-fade-in">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 animate-scale-in">
                {t.hero.bookNow}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t.booking.title}</DialogTitle>
                <DialogDescription>
                  {t.booking.description}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.booking.name}</Label>
                  <Input
                    id="name"
                    value={bookingData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t.booking.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.booking.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomType">{t.booking.roomType}</Label>
                  <Select value={bookingData.roomType} onValueChange={(value) => handleInputChange("roomType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.booking.roomType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="glamping">{t.rooms.glamping}</SelectItem>
                      <SelectItem value="square">{t.rooms.square}</SelectItem>
                      <SelectItem value="vip">{t.rooms.vip}</SelectItem>
                      <SelectItem value="yurt">{t.rooms.yurt}</SelectItem>
                      <SelectItem value="tapshan">{t.rooms.tapshan}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">{t.booking.checkIn}</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => handleInputChange("checkIn", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">{t.booking.checkOut}</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => handleInputChange("checkOut", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">{t.booking.checkInTime}</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={bookingData.checkInTime}
                      onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">{t.booking.checkOutTime}</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={bookingData.checkOutTime}
                      onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.booking.submitting : t.booking.confirm}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">{t.rooms.title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes.map((room) => (
              <Card key={room.id} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Home className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <CardTitle>{t.rooms[room.id as keyof typeof t.rooms]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t.rooms.workdays}:</span>
                      <span className="font-semibold">{room.workday.toLocaleString()} ₸</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.rooms.weekends}:</span>
                      <span className="font-semibold">{room.weekend.toLocaleString()} ₸</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.rooms.people}:</span>
                      <span>{room.capacity}</span>
                    </div>
                    <div className="pt-2 text-sm text-muted-foreground">
                      <p>{t.rooms.includes}</p>
                      <p>{t.rooms.shower}</p>
                      {room.extras && (
                        <div className="mt-2">
                          <p>{t.rooms.extra}: 10,000 ₸</p>
                          <p>{t.rooms.child}: 5,000 ₸</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">{t.features.title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>{t.features.location}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t.features.locationDesc}
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Crown className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>{t.features.service}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t.features.serviceDesc}
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>{t.features.safety}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t.features.safetyDesc}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">{t.amenities.title}</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="flex items-center space-x-4">
              <Wifi className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.wifi}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Utensils className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.breakfast}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Car className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.parking}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.schedule}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Coffee className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.cauldron}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Target className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.archery}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Bath className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.banya}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Fish className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.trout}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Waves className="w-8 h-8 text-primary" />
              <span className="text-lg">{t.amenities.spring}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">{t.location.title}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <MapPin className="w-6 h-6 text-primary" />
                <span>{t.location.address}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Car className="w-6 h-6 text-primary" />
                <span>{t.location.distance}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Mountain className="w-6 h-6 text-primary" />
                <span>{t.location.altitude}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Camera className="w-6 h-6 text-primary" />
                <span>{t.location.view}</span>
              </div>
            </div>
            <div className="bg-primary/10 p-6 rounded-lg">
              <h3 className="font-bold mb-4">Время работы:</h3>
              <p>Чек-ин: 14:00</p>
              <p>Чек-аут: 12:00</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Завтрак подается на следующий день утром
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">{t.cta.title}</h2>
          <p className="text-xl mb-8 text-muted-foreground">
            {t.cta.subtitle}
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg px-8 py-6">
                {t.cta.book}
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Vivood Tau</h3>
          <p className="text-muted-foreground mb-4">
            {t.footer.description}
          </p>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            <span>Трансфер: +7 (___) ___-__-__</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Vivood Tau. {t.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
