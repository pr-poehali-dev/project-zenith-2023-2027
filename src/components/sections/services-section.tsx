import { useReveal } from "@/hooks/use-reveal"

const SERVICES = [
  {
    number: "01",
    title: "Поддерживающая уборка",
    tag: "квартира / дом",
    description: "Регулярная уборка: пыль, полы, санузлы, кухня. Приходим по расписанию — еженедельно или дважды в месяц.",
    direction: "top",
  },
  {
    number: "02",
    title: "Генеральная уборка",
    tag: "глубокая чистка",
    description: "Моем всё, включая труднодоступные места, плинтусы, технику снаружи, зеркала и светильники.",
    direction: "right",
  },
  {
    number: "03",
    title: "Уборка после ремонта",
    tag: "строительный мусор",
    description: "Удаляем строительную пыль, остатки краски и штукатурки. Сдаём объект в идеальном состоянии.",
    direction: "left",
  },
  {
    number: "04",
    title: "Мытьё окон и балконов",
    tag: "внутри и снаружи",
    description: "Моем окна, рамы, откосы и балконное остекление. Без разводов — профессиональными составами.",
    direction: "bottom",
  },
  {
    number: "05",
    title: "Химчистка мебели и ковров",
    tag: "пятна · запахи · аллергены",
    description: "Чистка диванов, кресел, матрасов и ковров. Возможно через партнёра — уточняйте при заказе.",
    direction: "top",
  },
  {
    number: "06",
    title: "Уборка офисов",
    tag: "контрактная · утром / вечером",
    description: "Регулярный клининг офисов и бизнес-центров. Работаем до или после рабочего дня — не мешаем сотрудникам.",
    direction: "right",
  },
  {
    number: "07",
    title: "Дополнительные услуги",
    tag: "по времени",
    description: "Духовка, холодильник, вытяжка, санузлы «премиум», глажка. Добавляйте к основной уборке.",
    direction: "left",
  },
  {
    number: "08",
    title: "Дезинфекция квартиры",
    tag: "после смерти / болезни",
    description: "Деликатная и профессиональная дезинфекция. Биологическая обработка, устранение запахов, полное восстановление.",
    direction: "bottom",
  },
  {
    number: "09",
    title: "Уход за местом захоронения",
    tag: "уборка · озеленение",
    description: "Уборка на могиле, уход за надгробием, высадка цветов и сезонное обслуживание.",
    direction: "top",
  },
]

export function ServicesSection() {
  const { ref, isVisible } = useReveal(0.2)

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start flex-col px-6 pt-20 pb-8 md:px-12 md:pt-24 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl flex flex-col h-full">
        <div
          className={`mb-6 shrink-0 transition-all duration-700 md:mb-8 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-1 font-sans text-4xl font-light tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Услуги
          </h2>
          <p className="font-mono text-sm text-foreground/60">/ Что мы делаем</p>
        </div>

        <div className="overflow-y-auto flex-1 pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}>
          <div className="grid gap-x-16 gap-y-6 md:grid-cols-3 md:gap-y-8 lg:gap-x-24">
            {SERVICES.map((service, i) => (
              <ServiceCard key={i} service={service} index={i} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  index,
  isVisible,
}: {
  service: { number: string; title: string; tag: string; description: string; direction: string }
  index: number
  isVisible: boolean
}) {
  const getRevealClass = () => {
    if (!isVisible) {
      switch (service.direction) {
        case "left": return "-translate-x-12 opacity-0"
        case "right": return "translate-x-12 opacity-0"
        case "top": return "-translate-y-12 opacity-0"
        case "bottom": return "translate-y-12 opacity-0"
        default: return "translate-y-8 opacity-0"
      }
    }
    return "translate-x-0 translate-y-0 opacity-100"
  }

  return (
    <div
      className={`group border-b border-foreground/10 pb-6 transition-all duration-700 hover:border-foreground/25 ${getRevealClass()}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mb-2 flex items-center gap-3">
        <span className="font-mono text-xs text-foreground/30 transition-colors group-hover:text-foreground/50">{service.number}</span>
        <span className="rounded-full border border-foreground/15 px-2 py-0.5 font-mono text-[10px] text-foreground/50">{service.tag}</span>
      </div>
      <h3 className="mb-1.5 font-sans text-lg font-light text-foreground transition-transform duration-300 group-hover:translate-x-1 md:text-xl">
        {service.title}
      </h3>
      <p className="text-xs leading-relaxed text-foreground/65 md:text-sm">{service.description}</p>
    </div>
  )
}
