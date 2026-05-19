// import React from 'react';
// import { Typography, Divider, Skeleton } from 'antd';

// type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>;

// interface LazySectionProps {
//   id: string;
//   title: string;
//   component: LazyComp;
//   estimatedHeight?: number; // 预估高度，用于占位
// }

// const { Title } = Typography;

// const LazySection: React.FC<LazySectionProps> = ({ id, title, component: Component, estimatedHeight = 720 }) => {
//   const ref = React.useRef<HTMLDivElement | null>(null);
//   const [active, setActive] = React.useState(false);

//   React.useEffect(() => {
//     const el = ref.current;
//     if (!el) return;

//     // 尝试找到最近的滚动容器作为 root（Tabs、Drawer、Layout 等）
//     const findScrollableRoot = (node: Element | null): Element | null => {
//       if (!node) return null;
//       // 常见可滚动容器优先匹配
//       const preferred = node.closest(
//         '.ant-tabs-content-holder, .ant-drawer-body, .ant-layout-content, .ant-pro-layout .ant-layout-content'
//       );
//       if (preferred) return preferred as Element;
//       // 兜底：向上查找 overflow 为 auto/scroll 的元素
//       let p: Element | null = node.parentElement;
//       while (p) {
//         const style = window.getComputedStyle(p);
//         const overflowY = style.overflowY || style.overflow;
//         if (/(auto|scroll)/i.test(overflowY)) return p;
//         p = p.parentElement;
//       }
//       return null;
//     };

//     const rootEl = findScrollableRoot(el);

//     const io = new IntersectionObserver(
//       (entries) => {
//         for (const entry of entries) {
//           if (entry.isIntersecting) {
//             setActive(true);
//             io.disconnect();
//             break;
//           }
//         }
//       },
//       {
//         root: (rootEl as Element) || undefined,
//         rootMargin: '400px 0px',
//         threshold: 0.01,
//       }
//     );

//     io.observe(el);
//     return () => io.disconnect();
//   }, []);

//   return (
//     <section id={id} ref={ref} style={{ marginTop: 16, marginBottom: 24 }}>
//       <Divider />
//       <Title level={4} style={{ marginTop: 0 }}>{title}</Title>
//       {active ? (
//         <React.Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
//           <Component />
//         </React.Suspense>
//       ) : (
//         <div aria-busy style={{ minHeight: estimatedHeight }}>
//           <Skeleton active paragraph={{ rows: 6 }} />
//         </div>
//       )}
//     </section>
//   );
// };

// export default LazySection;

import React from 'react'
import { Typography, Divider, Skeleton } from 'antd'

type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>

interface LazySectionProps {
  id: string
  title: string
  component: LazyComp
  estimatedHeight?: number // 预估高度，用于占位
  componentProps?: Record<string, any> // 透传给子组件的 props（可选）
}

const { Title } = Typography

const LazySection: React.FC<LazySectionProps> = ({
  id,
  title,
  component: Component,
  estimatedHeight = 720,
  componentProps,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [active, setActive] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true)
            // 激活后不再观察，避免重复触发
            io.disconnect()
          }
        })
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id={id} ref={ref} style={{ marginTop: 16, marginBottom: 24 }}>
      <Divider />
      <Title level={4} style={{ marginTop: 0 }}>
        {title}
      </Title>
      {active ? (
        <React.Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
          <Component {...(componentProps || {})} />
        </React.Suspense>
      ) : (
        <div aria-busy style={{ minHeight: estimatedHeight }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      )}
    </section>
  )
}

export default LazySection
