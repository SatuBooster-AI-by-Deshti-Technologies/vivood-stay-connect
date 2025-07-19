import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Wifi, Car, Utensils, Shield, Mountain, Trees, Waves, Users, Coffee, Home, Star, Clock, Globe, Phone, Crown, Camera, Fish, Target, TreePine, Bath } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type Language = 'kz' | 'ru' | 'en';

interface AccommodationType {
  id: string;
  name_kz: string;
  name_ru: string;
  name_en: string;
  description_kz: string;
  description_ru: string;
  description_en: string;
  price: number;
  features: string[];
  is_active: boolean;
  images?: string[];
}

const translations = {
  kz: {
    hero: {
      title: "VIVOOD TAU",
      subtitle: "ЗОНА ОТДЫХА",
      description: "Түркістан облысындағы ең биік демалыс орны. Сайрам шыңы - 4236 м",
      bookNow: "Үй таңдау"
    },
    accommodations: {
      title: "Үй түрлері",
      subtitle: "Әр түрлі үй таулардағы ерекше демалыс үшін жасалған"
    },
    rooms: {
      glamping: "Глэмпинг (дөңгелек домик)",
      square: "Квадрат домик",
      vip: "VIP Капсула кинотеатрмен",
      workdays: "Жұмыс күндері",
      weekends: "Демалыс күндері",
      includes: "Таңғы ас кіреді",
      shower: "Душ, дәретхана бар",
      book: "Брондау"
    },
    booking: {
      title: "Брондау",
      description: "Нысанды толтырыңыз, біз сізбен байланысамыз",
      name: "Толық аты-жөні",
      phone: "Телефон нөмірі",
      email: "Email мекенжайы",
      checkIn: "Кіру күні",
      checkOut: "Шығу күні",
      checkInTime: "Кіру уақыты",
      checkOutTime: "Шығу уақыты",
      confirm: "Брондауды растау",
      submitting: "Жіберілуде...",
      thanks: "Брондау қабылданды!",
      contact: "Жақын арада сізбен байланысамыз"
    }
  },
  ru: {
    hero: {
      title: "VIVOOD TAU",
      subtitle: "ЗОНА ОТДЫХА",
      description: "Уникальный глэмпинг в сердце гор Сайрам-Өгем. Испытайте комфорт среди дикой природы на высоте 2000+ метров с панорамным видом на Сайрам шыңы (4236 м).",
      bookNow: "Выбрать домик"
    },
    accommodations: {
      title: "Выберите ваш домик",
      subtitle: "Каждый тип размещения создан для незабываемого отдыха в горах"
    },
    rooms: {
      glamping: "Глэмпинг (круглый домик)",
      square: "Квадратный домик",
      vip: "VIP Капсула с кинотеатром",
      workdays: "Рабочие дни",
      weekends: "Выходные",
      includes: "Завтрак включен",
      shower: "Душ, туалет",
      book: "Забронировать"
    },
    booking: {
      title: "Бронирование",
      description: "Заполните форму и мы свяжемся с вами для подтверждения",
      name: "Полное имя",
      phone: "Номер телефона", 
      email: "Email адрес",
      checkIn: "Дата заезда",
      checkOut: "Дата выезда",
      checkInTime: "Время заезда",
      checkOutTime: "Время выезда",
      confirm: "Подтвердить бронь",
      submitting: "Отправляем...",
      thanks: "Бронь принята!",
      contact: "Мы свяжемся с вами в ближайшее время"
    }
  },
  en: {
    hero: {
      title: "VIVOOD TAU",
      subtitle: "RECREATION ZONE",
      description: "Unique glamping in the heart of Sairam-Өgem mountains. Experience comfort amidst wild nature at 2000+ meters altitude with panoramic views of Sairam peak (4236 m).",
      bookNow: "Choose Accommodation"
    },
    accommodations: {
      title: "Choose Your Accommodation",
      subtitle: "Each accommodation type is designed for an unforgettable mountain retreat"
    },
    rooms: {
      glamping: "Glamping (Round House)",
      square: "Square House",
      vip: "VIP Capsule with Cinema",
      workdays: "Weekdays",
      weekends: "Weekends",
      includes: "Breakfast included",
      shower: "Shower, toilet",
      book: "Book Now"
    },
    booking: {
      title: "Booking",
      description: "Fill out the form and we will contact you for confirmation",
      name: "Full Name",
      phone: "Phone Number",
      email: "Email Address", 
      checkIn: "Check-in Date",
      checkOut: "Check-out Date",
      checkInTime: "Check-in Time",
      checkOutTime: "Check-out Time",
      confirm: "Confirm Booking",
      submitting: "Submitting...",
      thanks: "Booking Accepted!",
      contact: "We will contact you soon"
    }
  }
};


const Index = () => {
  const [language, setLanguage] = useState<Language>('ru');
  const [accommodationTypes, setAccommodationTypes] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    accommodationType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const t = translations[language];

  useEffect(() => {
    loadAccommodationTypes();
  }, []);

  const loadAccommodationTypes = async () => {
    try {
      const data = await api.getAccommodations();
      setAccommodationTypes(data || []);
    } catch (error) {
      console.error('Error loading accommodation types:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Сохраняем бронирование в базу данных
    try {
      await api.createBooking({
        accommodation_type: formData.accommodationType,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        guests: formData.guests,
        name: formData.name,
        email: `guest_${Date.now()}@vivoodtau.com`, // Автогенерация email
        phone: formData.phone,
        status: 'pending'
      });

      toast({
        title: t.booking.thanks,
        description: t.booking.contact,
      });
      
      // Reset form and close dialog
      setFormData({
        name: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: 2,
        accommodationType: ''
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать бронирование. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const openBookingDialog = (accommodationType: string) => {
    setFormData(prev => ({ ...prev, accommodationType }));
    setIsOpen(true);
  };

  const scrollToAccommodations = () => {
    document.getElementById('accommodations')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Language Selector */}
      <div className="fixed top-6 right-6 z-50">
        <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
          <SelectTrigger className="w-20 bg-card/80 backdrop-blur-sm border-border/50">
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" 
             style={{ background: 'var(--gradient-hero)' }}></div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-20"></div>
        
        {/* Floating Elements */}
        <Mountain className="absolute top-20 left-10 w-32 h-32 text-primary/20 animate-pulse" />
        <TreePine className="absolute bottom-20 right-10 w-24 h-24 text-secondary/20 animate-pulse" />
        <Waves className="absolute top-1/2 right-20 w-20 h-20 text-accent/20 animate-pulse" />
        
        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <div className="w-32 h-32 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center shadow-elegant backdrop-blur-sm border border-primary/20">
              <span className="text-5xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">V</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-2 text-foreground tracking-wide">
              {t.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium mb-4">
              {t.hero.subtitle}
            </p>
          </div>
          
          <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in">
            {t.hero.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 shadow-elegant hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              onClick={scrollToAccommodations}
            >
              {t.hero.bookNow}
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2 hover:bg-primary/5 backdrop-blur-sm">
              <Phone className="w-5 h-5 mr-2" />
              +7 (707) 123-45-67
            </Button>
          </div>
        </div>
      </section>

      {/* Accommodation Types */}
      <section id="accommodations" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t.accommodations.title}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.accommodations.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center">Загрузка...</div>
            ) : accommodationTypes.map((accommodation) => (
                <Card key={accommodation.id} className="group hover:shadow-elegant transition-all duration-300 border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:-translate-y-2">
                  <div className="relative overflow-hidden rounded-t-lg">
                    {accommodation.images && accommodation.images.length > 0 ? (
                      <img 
                        src={api.getImageUrl(accommodation.images[0])}
                        alt={accommodation.name_ru}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <img 
                        src="/placeholder.svg" 
                        alt={accommodation.name_ru}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Популярный
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-card/90 backdrop-blur-sm p-2 rounded-full">
                        <Home className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-2xl text-foreground group-hover:text-primary transition-colors">
                      {language === 'kz' ? accommodation.name_kz : language === 'en' ? accommodation.name_en : accommodation.name_ru}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-base">
                      {language === 'kz' ? accommodation.description_kz : language === 'en' ? accommodation.description_en : accommodation.description_ru}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Capacity */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-5 h-5 text-secondary" />
                      <span>До 4 человек</span>
                    </div>
                    
                    {/* Features */}
                    <div className="space-y-2">
                      {accommodation.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Цена за ночь:</span>
                        <span className="font-bold text-lg text-foreground">{accommodation.price.toLocaleString()} ₸</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => openBookingDialog(accommodation.name_ru)}
                    >
                      {t.rooms.book} {language === 'kz' ? accommodation.name_kz : language === 'en' ? accommodation.name_en : accommodation.name_ru}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Почему <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Vivood Tau</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg">
              <Mountain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Панорамный вид</h3>
              <p className="text-muted-foreground text-sm">На пик Сайрам 4236м</p>
            </Card>
            
            <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg">
              <Shield className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Безопасность</h3>
              <p className="text-muted-foreground text-sm">Охраняемая территория</p>
            </Card>
            
            <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg">
              <Coffee className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Комфорт</h3>
              <p className="text-muted-foreground text-sm">Завтрак и удобства</p>
            </Card>
            
            <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg">
              <Wifi className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Wi-Fi</h3>
              <p className="text-muted-foreground text-sm">Интернет в горах</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            <MapPin className="w-10 h-10 inline-block text-primary mr-3" />
            Расположение
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Каскелена выше, Сайрам-Үгем Ұлттық паркінің ішінде
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg">
              <Car className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">80 км от Шымкента</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg">
              <Mountain className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="font-semibold">2000+ м над уровнем моря</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg">
              <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="font-semibold">Заезд с 14:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t.booking.title}</DialogTitle>
            <DialogDescription className="text-base">
              {t.booking.description}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.booking.name}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t.booking.name}
                required
                className="h-12"
              />
            </div>
            
            
            <div className="space-y-2">
              <Label htmlFor="phone">{t.booking.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
                required
                className="h-12"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">{t.booking.checkIn}</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">{t.booking.checkOut}</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                  required
                  className="h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guests">Количество гостей</Label>
              <Select value={formData.guests.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, guests: parseInt(value) }))}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 гость</SelectItem>
                  <SelectItem value="2">2 гостя</SelectItem>
                  <SelectItem value="3">3 гостя</SelectItem>
                  <SelectItem value="4">4 гостя</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" 
              disabled={isLoading}
            >
              {isLoading ? t.booking.submitting : t.booking.confirm}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-sm py-12 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">V</span>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-foreground">VIVOOD TAU</h3>
          <p className="text-muted-foreground mb-6">Глэмпинг в горах Шымкента</p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+7 (707) 123-45-67</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Сайрам-Үгем паркі</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted-foreground">
            © 2024 Vivood Tau. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;