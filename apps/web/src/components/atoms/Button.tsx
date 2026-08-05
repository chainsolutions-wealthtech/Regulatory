import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type CommonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: IconName;
  className?: string;
};

type LinkProps = CommonProps & { href: string; type?: never; disabled?: never };
type NativeProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

export function Button(props: LinkProps | NativeProps) {
  const { children, variant = "primary", size = "md", icon, className = "" } = props;
  const classes = `button button--${variant} button--${size} ${className}`.trim();
  const content = <>{icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : null}<span>{children}</span></>;
  if ("href" in props && props.href) return <Link className={classes} href={props.href}>{content}</Link>;
  const { href: _href, ...nativeProps } = props as NativeProps & { href?: never };
  return <button className={classes} {...nativeProps}>{content}</button>;
}
