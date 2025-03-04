declare module 'react-native-chart-kit' {
  import { ViewStyle } from 'react-native';

  interface ChartConfig {
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    color?: (opacity?: number) => string;
    strokeWidth?: number;
    barPercentage?: number;
    useShadowColorFromDataset?: boolean;
    decimalPlaces?: number;
    style?: ViewStyle;
  }

  interface Dataset {
    data: number[];
    color?: string | ((opacity: number) => string);
    strokeWidth?: number;
  }

  interface LineChartData {
    labels: string[];
    datasets: Dataset[];
  }

  interface PieChartData {
    name: string;
    population: number;
    color: string;
    legendFontColor?: string;
    legendFontSize?: number;
  }

  interface ChartProps {
    data: any;
    width: number;
    height: number;
    chartConfig: ChartConfig;
    style?: ViewStyle;
  }

  interface LineChartProps extends ChartProps {
    data: LineChartData;
    bezier?: boolean;
    withDots?: boolean;
    withInnerLines?: boolean;
    withOuterLines?: boolean;
    withVerticalLabels?: boolean;
    withHorizontalLabels?: boolean;
  }

  interface PieChartProps extends ChartProps {
    data: PieChartData[];
    accessor: string;
    backgroundColor?: string;
    paddingLeft?: string;
    absolute?: boolean;
    hasLegend?: boolean;
  }

  export class LineChart extends React.Component<LineChartProps> {}
  export class PieChart extends React.Component<PieChartProps> {}
}
