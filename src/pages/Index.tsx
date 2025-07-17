import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Star, Wifi, Coffee, Car, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    checkInTime: "",
    checkOutTime: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Симуляция отправки данных
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Спасибо за заявку!",
      description: "Мы свяжемся с вами в ближайшее время для подтверждения бронирования.",
    });
    
    setIsSubmitting(false);
    setIsDialogOpen(false);
    setBookingData({
      name: "",
      phone: "",
      checkIn: "",
      checkOut: "",
      checkInTime: "",
      checkOutTime: ""
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
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Vivood Tau
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            Уникальный глэмпинг в горах Алматы. Комфорт природы с роскошью отеля.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                Забронировать сейчас
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Бронирование</DialogTitle>
                <DialogDescription>
                  Заполните форму и мы свяжемся с вами для подтверждения
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ФИО</Label>
                  <Input
                    id="name"
                    value={bookingData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Введите ваше ФИО"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Дата заезда</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => handleInputChange("checkIn", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Дата выезда</Label>
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
                    <Label htmlFor="checkInTime">Время заезда</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={bookingData.checkInTime}
                      onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">Время выезда</Label>
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
                  {isSubmitting ? "Отправляем..." : "Подтвердить бронь"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Почему выбирают нас</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Уникальное расположение</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Живописные горы Алматы, чистый воздух и потрясающие виды на природу
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Премиум сервис</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Индивидуальный подход к каждому гостю и высокий уровень обслуживания
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Безопасность</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Охраняемая территория, медицинская помощь, страхование гостей
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Удобства</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center space-x-4">
              <Wifi className="w-8 h-8 text-primary" />
              <span className="text-lg">WiFi</span>
            </div>
            <div className="flex items-center space-x-4">
              <Coffee className="w-8 h-8 text-primary" />
              <span className="text-lg">Кофе машина</span>
            </div>
            <div className="flex items-center space-x-4">
              <Car className="w-8 h-8 text-primary" />
              <span className="text-lg">Парковка</span>
            </div>
            <div className="flex items-center space-x-4">
              <Calendar className="w-8 h-8 text-primary" />
              <span className="text-lg">Круглосуточно</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Готовы к незабываемому отдыху?</h2>
          <p className="text-xl mb-8 text-muted-foreground">
            Забронируйте свой отдых в Vivood Tau прямо сейчас
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg px-8 py-6">
                Забронировать
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
            Глэмпинг в горах Алматы | Телефон: +7 (777) 123-45-67
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 Vivood Tau. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
