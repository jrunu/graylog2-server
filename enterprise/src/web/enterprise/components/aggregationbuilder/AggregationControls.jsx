import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-bootstrap';
import * as Immutable from 'immutable';

import CustomPropTypes from 'enterprise/components/CustomPropTypes';
import AggregationWidgetConfig from 'enterprise/logic/aggregationbuilder/AggregationWidgetConfig';
import { defaultCompare } from 'enterprise/logic/DefaultCompare';

import PivotSortConfig from 'enterprise/logic/aggregationbuilder/PivotSortConfig';
import SeriesSortConfig from 'enterprise/logic/aggregationbuilder/SeriesSortConfig';

import VisualizationTypeSelect from './VisualizationTypeSelect';
import ColumnPivotConfiguration from './ColumnPivotConfiguration';
import RowPivotSelect from './RowPivotSelect';
import ColumnPivotSelect from './ColumnPivotSelect';
import SortDirectionSelect from './SortDirectionSelect';
import SortSelect from './SortSelect';
import SeriesSelect from './SeriesSelect';
import { PivotList } from './AggregationBuilderPropTypes';
import DescriptionBox from './DescriptionBox';
import SeriesFunctionsSuggester from './SeriesFunctionsSuggester';

export default class AggregationControls extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    config: PropTypes.shape({
      columnPivots: PivotList,
      rowPivots: PivotList,
      series: PropTypes.arrayOf(PropTypes.string),
      sort: PropTypes.arrayOf(PropTypes.string),
      visualization: PropTypes.string,
      rollup: PropTypes.bool,
    }).isRequired,
    fields: CustomPropTypes.FieldListType.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {
    rowPivots: [],
    columnPivots: [],
    sort: [],
    series: [],
    visualization: 'table',
  };

  constructor(props) {
    super(props);

    const { config } = props;
    const { columnPivots, rowPivots, sort, series, visualization, rollup } = config;
    this.state = { config: new AggregationWidgetConfig(columnPivots, rowPivots, series, sort, visualization, rollup) };
  }

  _onColumnPivotChange = (columnPivots) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().columnPivots(columnPivots).build() }));
  };

  _onRowPivotChange = (rowPivots) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().rowPivots(rowPivots).build() }));
  };

  _onSeriesChange = (series) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().series(series).build() }));
  };

  _onSortChange = (sort) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().sort(sort).build() }));
  };

  _onSortDirectionChange = (direction) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().sort(state.config.sort.map(sort => sort.toBuilder().direction(direction).build())).build() }));
  };

  _onRollupChange = (checked) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().rollup(checked).build() }));
  };

  _onVisualizationChange = (visualization) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().visualization(visualization).build() }));
  };

  _onVisualizationConfigChange = (visualizationConfig) => {
    this._setAndPropagate(state => ({ config: state.config.toBuilder().visualizationConfig(visualizationConfig).build() }));
  };

  _setAndPropagate = fn => this.setState(fn, this._propagateState);

  _propagateState() {
    this.props.onChange(this.state.config);
  }

  render() {
    const { children, fields } = this.props;
    const { columnPivots, rowPivots, series, sort, visualization, rollup } = this.state.config;

    const sortDirection = Immutable.Set(sort.map(s => s.direction)).first();

    const formattedFields = fields
      .map(fieldType => fieldType.name)
      .valueSeq()
      .toJS()
      .sort(defaultCompare);
    const formattedFieldsOptions = formattedFields.map(v => ({ label: v, value: v }));
    const suggester = new SeriesFunctionsSuggester(formattedFields);

    const childrenWithCallback = React.Children.map(children, child => React.cloneElement(child, { onVisualizationConfigChange: this._onVisualizationConfigChange }));
    return (
      <span>
        <Row>
          <Col md={2} style={{ paddingRight: '2px' }}>
            <DescriptionBox description="Visualization Type">
              <VisualizationTypeSelect value={visualization} onChange={this._onVisualizationChange} />
            </DescriptionBox>
          </Col>
          <Col md={3} style={{ paddingLeft: '2px', paddingRight: '2px' }}>
            <DescriptionBox description="Rows" help="Values from these fields generate new rows.">
              <RowPivotSelect fields={formattedFieldsOptions} rowPivots={rowPivots} onChange={this._onRowPivotChange} />
            </DescriptionBox>
          </Col>
          <Col md={3} style={{ paddingLeft: '2px', paddingRight: '2px' }}>
            <DescriptionBox description="Columns"
                            help="Values from these fields generate new subcolumns."
                            configurableOptions={<ColumnPivotConfiguration rollup={rollup} onRollupChange={this._onRollupChange} />}>
              <ColumnPivotSelect fields={formattedFieldsOptions} columnPivots={columnPivots} onChange={this._onColumnPivotChange} />
            </DescriptionBox>
          </Col>
          <Col md={2} style={{ paddingLeft: '2px', paddingRight: '2px' }}>
            <DescriptionBox description="Sorting">
              <SortSelect pivots={rowPivots} series={series} sort={sort} onChange={this._onSortChange} />
            </DescriptionBox>
          </Col>
          <Col md={2} style={{ paddingLeft: '2px' }}>
            <DescriptionBox description="Direction">
              <SortDirectionSelect disabled={!sort || sort.length === 0}
                                   direction={sortDirection && sortDirection.direction}
                                   onChange={this._onSortDirectionChange} />
            </DescriptionBox>
          </Col>
        </Row>
        <Row style={{ height: 'calc(100% - 110px)' }}>
          <Col md={2}>
            <DescriptionBox description="Metrics" help="The unit which is tracked for every row and subcolumn.">
              <SeriesSelect onChange={this._onSeriesChange} series={series} suggester={suggester} />
            </DescriptionBox>
          </Col>
          <Col md={10} style={{ height: '100%' }}>
            {childrenWithCallback}
          </Col>
        </Row>
      </span>
    );
  }
}
