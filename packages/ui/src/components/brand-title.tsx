type BrandTitleProps = {
  subtitle?: string;
};

export function BrandTitle({
  subtitle,
}: BrandTitleProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        CareerTrack
      </h1>

      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}