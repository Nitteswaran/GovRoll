import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Govroll has made payroll processing effortless. Our employees now receive their salaries on time every month without any hassle.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Aisyah Binti Rahman",
    role: "HR Manager",
  },
  {
    text: "The migration to Govroll was seamless. The system is intuitive, and our finance team adapted quickly without any training headaches.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Tan Meng Fong",
    role: "Finance Manager",
  },
  {
    text: "Customer support from Govroll is exceptional. They guided us through setup and resolved queries promptly, keeping payroll running smoothly.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Nurul Huda",
    role: "HR Executive",
  },
  {
    text: "Govroll’s integration with our existing systems saved us hours of manual work. Payroll automation has never been this efficient.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Mohd Rizal",
    role: "Operations Director",
  },
  {
    text: "The system’s reporting features are excellent. We now have clear visibility of employee salaries, deductions, and benefits in real-time.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Amirul Faizal",
    role: "Payroll Officer",
  },
  {
    text: "Govroll simplified compliance with Malaysian employment laws. Tax calculations and EPF/SOCSO contributions are automated perfectly.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Alia Syafiqah",
    role: "HR Analyst",
  },
  {
    text: "Our HR team loves Govroll’s self-service portal. Employees can view payslips and update information anytime, reducing our admin load.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Farid Hakim",
    role: "HR Coordinator",
  },
  {
    text: "Govroll helped us streamline payroll for multiple branches. The centralized dashboard makes monitoring employee payments effortless.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Shazana Zulkifli",
    role: "Payroll Manager",
  },
  {
    text: "Since adopting Govroll, our payroll errors have dropped to zero. It’s reliable, fast, and fully supports Malaysian payroll regulations.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Hafizuddin",
    role: "Finance Executive",
  },
];



const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);


export function Testimonials() {
  return (
    <section className="my-20 relative">

      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

