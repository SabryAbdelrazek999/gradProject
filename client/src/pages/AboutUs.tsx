import { motion, useMotionValue, useTransform } from "framer-motion";

const supervisor = {
  name: "Dr. Nancy ElShaer",
  role: "Supervisor",
};

const team = [
  { name: "Abdelrahman Khaled Mohamed", role: "Developer" },
  { name: "Abdelrahman Mohamed Antar", role: "Developer" },
  { name: "Ali El Sayed Shalaby", role: "Developer" },
  { name: "Hatem Reda Abolnaga", role: "Developer" },
  { name: "Islam Hany AlAshqar", role: "Developer" },
  { name: "Mazen Mohamed AlNahrawy", role: "Developer" },
  { name: "Mohamed El Sayed Sobhy", role: "Developer" },
  { name: "Mohamed Safwat Mohamed", role: "Developer" },
  { name: "Sabry Abdelrazek Ibrahim", role: "Developer" },
].sort((a, b) => a.name.localeCompare(b.name));

// -------------------- 3D TILT CARD --------------------
function TiltCard({ children }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-50, 50], [15, -15]);
  const rotateY = useTransform(x, [-50, 50], [-15, 15]);

  return (
    <motion.div
      style={{ rotateX, rotateY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - (rect.left + rect.width / 2));
        y.set(e.clientY - (rect.top + rect.height / 2));
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="transition-transform duration-300"
    >
      {children}
    </motion.div>
  );
}

// -------------------- PAGE ANIMATION VARIANTS --------------------
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutUs() {
  return (
    <motion.div
      className="p-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        variants={itemVariants}
        className="text-4xl font-bold text-center mb-10"
      >
        Our Team
      </motion.h1>

      {/* SUPERVISOR */}
      <motion.div variants={itemVariants} className="flex justify-center mb-16">
        <TiltCard>
          <div className="relative bg-gradient-to-br from-purple-700 to-purple-900 text-white p-10 rounded-3xl shadow-2xl w-96 hover:shadow-purple-500/40 transition-all duration-300">
            <h2 className="text-3xl font-extrabold text-center mt-4">
              {supervisor.name}
            </h2>
            <p className="text-center text-lg opacity-90">{supervisor.role}</p>
          </div>
        </TiltCard>
      </motion.div>

      {/* TEAM GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {team.map((member, index) => (
          <motion.div key={index} variants={itemVariants}>
            <TiltCard>
              <div className="group bg-purple-900 border border-gray-700 rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <h3 className="text-lg font-semibold text-center text-black">
                  {member.name}
                </h3>
                <p className="text-center text-sm text-gray-300">{member.role}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
