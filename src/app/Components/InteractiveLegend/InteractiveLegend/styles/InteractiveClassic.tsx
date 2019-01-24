/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

// dojo
import * as i18n from "dojo/i18n!../nls/Legend";
import * as i18nInteractiveLegend from "dojo/i18n!../../../../nls/resources";

// dojox.gfx
import { createSurface } from "dojox/gfx";

// esri.widgets.Widget
import Widget = require("esri/widgets/Widget");

// esri.core.accessorSupport.decorators
import {
  declared,
  property,
  subclass,
  aliasOf
} from "esri/core/accessorSupport/decorators";

//esri.widgets.support.widget
import {
  renderable,
  tsx,
  accessibleHandler
} from "esri/widgets/support/widget";

// esri.views.MapView
import MapView = require("esri/views/MapView");

// esri.layers.Layer
import Layer = require("esri/layers/Layer");

// esri.layers.ImageryLayer
import ImageryLayer = require("esri/layers/ImageryLayer");

// esri.core.Collection
import Collection = require("esri/core/Collection");

// esri.widgets.Legend.support.ActiveLayerInfo
import ActiveLayerInfo = require("esri/widgets/Legend/support/ActiveLayerInfo");

// esri.core.watchUtils
import watchUtils = require("esri/core/watchUtils");

// esri.layers.FeatureLayer
import FeatureLayer = require("esri/layers/FeatureLayer");

// InteractiveClassicViewModel
import InteractiveStyleViewModel = require("./InteractiveStyle/InteractiveStyleViewModel");

// esri.Grahpic
import Graphic = require("esri/Graphic");

// esri.core.Handles
import Handles = require("esri/core/Handles");

// esri.widgets.LayerList.LayerListViewModel
import LayerListViewModel = require("esri/widgets/LayerList/LayerListViewModel");

// styleUtils
import {
  attachToNode,
  getTitle,
  isImageryStretchedLegend,
  isRendererTitle
} from "../support/styleUtils";

// interfaces
import {
  ColorRampElement,
  HeatmapRampElement,
  LegendElement,
  OpacityRampElement,
  RendererTitle,
  SymbolTableElement,
  FilterMode,
  VNode,
  SelectedStyleData
} from "../../../../interfaces/interfaces";
import { renderRelationshipRamp } from "../relationshipRamp/utils";

//----------------------------------
//
//  CSS classes
//
//----------------------------------
const CSS = {
  widget: "esri-widget",
  base: "esri-legend esri-widget--panel",
  service: "esri-legend__service",
  label: "esri-legend__service-label",
  layer: "esri-legend__layer",
  groupLayer: "esri-legend__group-layer",
  groupLayerChild: "esri-legend__group-layer-child",
  layerTable: "esri-legend__layer-table",
  layerTableSizeRamp: "esri-legend__layer-table--size-ramp",
  layerChildTable: "esri-legend__layer-child-table",
  layerCaption: "esri-legend__layer-caption",
  layerBody: "esri-legend__layer-body",
  layerRow: "esri-legend__layer-row",
  layerCell: "esri-legend__layer-cell",
  layerInfo: "esri-legend__layer-cell esri-legend__layer-cell--info",
  imageryLayerStretchedImage: "esri-legend__imagery-layer-image--stretched",
  imageryLayerCellStretched: "esri-legend__imagery-layer-cell--stretched",
  imageryLayerInfoStretched: "esri-legend__imagery-layer-info--stretched",
  symbolContainer: "esri-legend__layer-cell esri-legend__layer-cell--symbols",
  symbol: "esri-legend__symbol",
  rampContainer: "esri-legend__ramps",
  sizeRamp: "esri-legend__size-ramp",
  colorRamp: "esri-legend__color-ramp",
  opacityRamp: "esri-legend__opacity-ramp",
  borderlessRamp: "esri-legend__borderless-ramp",
  rampTick: "esri-legend__ramp-tick",
  rampFirstTick: "esri-legend__ramp-tick-first",
  rampLastTick: "esri-legend__ramp-tick-last",
  rampLabelsContainer: "esri-legend__ramp-labels",
  rampLabel: "esri-legend__ramp-label",
  message: "esri-legend__message",
  // common
  header: "esri-widget__heading",
  hidden: "esri-hidden",
  calciteStyles: {
    refreshIcon: "icon-ui-refresh",
    btn: "btn",
    btnSmall: "btn-small",
    btnPrimary: "btn-primary",
    error: "icon-ui-error"
  },
  // interactive-legend
  loaderContainer: "esri-interactive-legend__loader-container",
  filterLayerRow: "esri-interactive-legend__filter-layer-row",
  selectedRow: "esri-interactive-legend--selected-row",
  loader: "esri-interactive-legend__loader",
  preventScroll: "esri-interactive-legend__prevent-scroll",
  screenshot: "esri-interactive-legend__screenshot",
  hoverStyles: "esri-interactive-legend--layer-row",
  error: "esri-interactive-legend--error"
};

const KEY = "esri-legend__",
  GRADIENT_WIDTH = 24;

@subclass("InteractiveClassic")
class InteractiveClassic extends declared(Widget) {
  //----------------------------------
  //
  //  Variables
  //
  //----------------------------------
  private _selectedStyleData: Collection<SelectedStyleData> = new Collection();
  private _handles = new Handles();

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  // activeLayerInfos
  @aliasOf("viewModel.activeLayerInfos")
  @property()
  activeLayerInfos: Collection<ActiveLayerInfo> = null;

  // view
  @aliasOf("viewModel.view")
  @property()
  view: MapView = null;

  // filterMode
  @aliasOf("viewModel.filterMode")
  @property()
  filterMode: FilterMode = null;

  // mutedShade
  @aliasOf("viewModel.mutedShade")
  @property()
  mutedShade: number[] = null;

  // mutedOpacity
  @aliasOf("viewModel.mutedOpacity")
  @property()
  mutedOpacity: number = null;

  // layerGraphics
  @aliasOf("viewModel.layerGraphics")
  @property()
  layerGraphics: Collection<Graphic[]> = null;

  // layerListViewModel
  @aliasOf("viewModel.layerListViewModel")
  @property()
  layerListViewModel: LayerListViewModel = null;

  // searchExpressions
  @aliasOf("viewModel.searchExpressions")
  @property()
  searchExpressions: Collection<string> = null;

  // viewModel
  @renderable(["viewModel.state"])
  @property({
    type: InteractiveStyleViewModel
  })
  viewModel: InteractiveStyleViewModel = new InteractiveStyleViewModel();

  // type
  @property({ readOnly: true })
  readonly type: "classic" = "classic";

  //-------------------------------------------------------------------
  //
  //  Lifecycle methods
  //
  //-------------------------------------------------------------------

  constructor(params?: any) {
    super();
  }

  postInitialize() {
    this.own([
      watchUtils.on(this, "viewModel.featureLayerViews", "change", () => {
        this._selectedStyleData.removeAll();
        this.viewModel.featureLayerViews.forEach(
          (featureLayerView: __esri.FeatureLayerView) => {
            if (!featureLayerView) {
              this._selectedStyleData.add(null);
            } else {
              const featureLayer = featureLayerView.layer as FeatureLayer;
              const renderer = featureLayer.renderer as any;
              const requiredFields = renderer ? renderer.requiredFields : null;
              this._selectedStyleData.add({
                layerItemId: featureLayer.id,
                selectedInfoIndex: [],
                requiredFields
              });
            }
          }
        );
      })
    ]);
  }

  render(): VNode {
    const { state } = this.viewModel;
    const activeLayerInfos = this.activeLayerInfos,
      baseClasses = this.classes(CSS.base, CSS.widget),
      filteredLayers =
        activeLayerInfos &&
        activeLayerInfos
          .toArray()
          .map((activeLayerInfo, activeLayerInfoIndex) =>
            this._renderLegendForLayer(activeLayerInfo, activeLayerInfoIndex)
          )
          .filter(layer => !!layer);
    const legendElements = [];
    this.activeLayerInfos.forEach(activeLayerInfo => {
      activeLayerInfo.legendElements.forEach(legendElement => {
        legendElements.push(legendElement);
      });
    });
    return (
      <div class={this.classes(baseClasses, CSS.preventScroll)}>
        {filteredLayers && filteredLayers.length ? (
          <div>
            {state === "loading" || state === "querying" ? (
              <div class={CSS.loader} />
            ) : (
              <div> {filteredLayers}</div>
            )}
          </div>
        ) : (
          <div class={CSS.message}>{i18n.noLegend}</div>
        )}
      </div>
    );
  }

  destroy() {
    this._handles.removeAll();
    this._handles.destroy();
    this._handles = null;
  }

  //--------------------------------------------------------------------------
  //
  //  Private methods
  //
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  //
  //  Render methods
  //
  //--------------------------------------------------------------------------

  private _renderLegendForLayer(
    activeLayerInfo: ActiveLayerInfo,
    activeLayerInfoIndex: number
  ): VNode {
    const { title } = activeLayerInfo;
    const titleIsString =
      typeof title === "string"
        ? title.includes("Description") || title.includes("Map Notes")
        : null;
    if (!activeLayerInfo.ready || titleIsString) {
      return null;
    }

    const hasChildren = !!activeLayerInfo.children.length;
    const key = `${KEY}${activeLayerInfo.layer.uid}-version-${
      activeLayerInfo.version
    }`;

    const labelNode = activeLayerInfo.title ? (
      <h3 class={this.classes(CSS.header, CSS.label)}>
        {activeLayerInfo.title}
      </h3>
    ) : null;

    if (hasChildren) {
      const layers = activeLayerInfo.children
        .map(childActiveLayerInfo =>
          this._renderLegendForLayer(childActiveLayerInfo, activeLayerInfoIndex)
        )
        .toArray();

      return (
        <div
          key={key}
          class={this.classes(CSS.service, CSS.groupLayer, CSS.screenshot)}
        >
          {labelNode}
          {layers}
        </div>
      );
    } else {
      const legendElements = activeLayerInfo.legendElements;

      if (legendElements && !legendElements.length) {
        return null;
      }
      const featureLayerViewIndex = this._getFeatureLayerViewIndex(
        activeLayerInfo
      );
      const filteredElements = legendElements
        .map((legendElement, legendElementIndex) => {
          return this._renderLegendForElement(
            legendElement,
            activeLayerInfo.layer,
            legendElementIndex,
            activeLayerInfo,
            activeLayerInfoIndex,
            featureLayerViewIndex,
            legendElement.infos,
            legendElements.length
          );
        })
        .filter(element => !!element);

      if (!filteredElements.length) {
        return null;
      }

      const layerClasses = {
        [CSS.groupLayerChild]: !!activeLayerInfo.parent
      };

      return (
        <div key={key} class={this.classes(CSS.service, layerClasses)}>
          {labelNode}
          {activeLayerInfo.layer.hasOwnProperty("sublayers") ? (
            <div class={CSS.error}>
              <span class={CSS.calciteStyles.error} />
              {i18nInteractiveLegend.sublayerFiltering}
            </div>
          ) : null}
          <div class={CSS.layer}>{filteredElements}</div>
        </div>
      );
    }
  }

  // _renderLegendForElement
  private _renderLegendForElement(
    legendElement: LegendElement,
    layer: Layer,
    legendElementIndex: number,
    activeLayerInfo: ActiveLayerInfo,
    activeLayerInfoIndex: number,
    featureLayerViewIndex: number,
    legendElementInfos: any[],
    legendElementsLength: number,
    isChild?: boolean
  ): VNode {
    const { type } = legendElement;
    const isColorRamp = type === "color-ramp",
      isOpacityRamp = type === "opacity-ramp",
      isSizeRamp = type === "size-ramp",
      isHeatRamp = type === "heatmap-ramp";

    let content: any = null;

    const legendTitle = legendElement.hasOwnProperty("title")
      ? (legendElement.title as any)
      : null;
    let field = null;
    const selectedStyleData = this._selectedStyleData.getItemAt(
      featureLayerViewIndex
    );
    if (selectedStyleData) {
      const { requiredFields } = selectedStyleData;

      if (legendElementsLength > 1) {
        const fieldVal =
          legendTitle && legendTitle.hasOwnProperty("field")
            ? legendTitle.field
            : null;
        if (requiredFields && fieldVal) {
          field = this._selectedStyleData
            .getItemAt(featureLayerViewIndex)
            .requiredFields.find(requiredField => requiredField === fieldVal);
        }
      } else {
        if (requiredFields && activeLayerInfo.layer.renderer.field) {
          field = this._selectedStyleData
            .getItemAt(featureLayerViewIndex)
            .requiredFields.find(
              requiredField =>
                requiredField ===
                activeLayerInfo.layer.renderer.requiredFields.find(
                  requiredField2 => requiredField === requiredField2
                )
            );
        }
      }
    }
    // build symbol table or size ramp
    if (legendElement.type === "symbol-table" || isSizeRamp) {
      const rows = (legendElement.infos as any)
        .map((info: any, legendInfoIndex: number) =>
          this._renderLegendForElementInfo(
            info,
            layer,
            isSizeRamp,
            (legendElement as SymbolTableElement).legendType,
            legendInfoIndex,
            field,
            legendElementIndex,
            legendTitle,
            legendElement,
            activeLayerInfo,
            activeLayerInfoIndex,
            featureLayerViewIndex,
            legendElementInfos
          )
        )
        .filter((row: any) => !!row);

      if (rows.length) {
        content = <div class={CSS.layerBody}>{rows}</div>;
      }
    } else if (
      legendElement.type === "color-ramp" ||
      legendElement.type === "opacity-ramp" ||
      legendElement.type === "heatmap-ramp"
    ) {
      content = this._renderLegendForRamp(legendElement);
    } else if (legendElement.type === "relationship-ramp") {
      content = renderRelationshipRamp(legendElement, this.id);
    }

    if (!content) {
      return null;
    }

    const titleObj = legendElement.title;
    let title: string = null;
    if (typeof titleObj === "string") {
      title = titleObj;
    } else if (titleObj) {
      const genTitle = getTitle(titleObj, isColorRamp || isOpacityRamp);
      if (
        isRendererTitle(titleObj, isColorRamp || isOpacityRamp) &&
        titleObj.title
      ) {
        title = `${(titleObj as RendererTitle).title} (${genTitle})`;
      } else {
        title = genTitle;
      }
    }

    const tableClass = isChild ? CSS.layerChildTable : CSS.layerTable,
      caption = title ? <div class={CSS.layerCaption}>{title}</div> : null;

    const tableClasses = {
      [CSS.layerTableSizeRamp]: isSizeRamp || !isChild
    };

    const hasPictureMarkersAndIsMute = this._checkForPictureMarkersAndIsMute(
      activeLayerInfo
    );

    const hasPictureFillAndIsMute = this._checkForPictureFillAndIsMute(
      activeLayerInfo
    );

    const isRelationship =
      (legendElement.type === "symbol-table" &&
        legendElement.title == "Relationship") ||
      legendElement.type === "relationship-ramp";
    return (
      <div class={this.classes(tableClass, tableClasses)}>
        {!field &&
        legendElementInfos &&
        legendElementInfos.length > 1 &&
        !isRelationship &&
        !activeLayerInfo.layer.hasOwnProperty("sublayers") &&
        !isColorRamp &&
        !isOpacityRamp &&
        !isHeatRamp ? (
          <div class={CSS.error}>
            <span class={CSS.calciteStyles.error} />
            {i18nInteractiveLegend.noFieldAttribute}
          </div>
        ) : null}

        {legendElementInfos &&
        legendElementInfos.every(
          elementInfo => !elementInfo.hasOwnProperty("value")
        ) &&
        legendElementInfos.length > 1 &&
        !isRelationship &&
        !activeLayerInfo.layer.hasOwnProperty("sublayers") ? (
          <div class={CSS.error}>
            <span class={CSS.calciteStyles.error} />
            {i18nInteractiveLegend.elementInfoNoValue}
          </div>
        ) : null}

        {legendElement.title === "Predominant category" ? (
          <div class={CSS.error}>
            <span class={CSS.calciteStyles.error} />
            {i18nInteractiveLegend.predominantNotSupported}
          </div>
        ) : null}

        {isSizeRamp && this.filterMode === "mute" ? (
          <div class={CSS.error}>
            <span class={CSS.calciteStyles.error} />
            {i18nInteractiveLegend.muteAndSizeRamp}
          </div>
        ) : null}

        {hasPictureMarkersAndIsMute &&
        legendElementInfos &&
        legendElementInfos.length > 1 ? (
          <div class={CSS.error}>
            <span class={CSS.calciteStyles.error} />
            {i18nInteractiveLegend.muteAndPictureMarkerError}
          </div>
        ) : null}

        {hasPictureFillAndIsMute &&
        legendElementInfos &&
        legendElementInfos.length > 1 ? (
          <div class={CSS.error}>
            <span class={CSS.calciteStyles.error} />
            {i18nInteractiveLegend.muteAndPictureFillError}
          </div>
        ) : null}

        {caption}
        {content}
      </div>
    );
  }

  // _renderLegendForRamp
  private _renderLegendForRamp(
    legendElement: ColorRampElement | OpacityRampElement | HeatmapRampElement
  ): VNode {
    const rampStops: any[] = legendElement.infos;
    const isOpacityRamp = legendElement.type === "opacity-ramp";
    const isHeatmapRamp = legendElement.type === "heatmap-ramp";
    const numGradients = rampStops.length - 1;

    const rampWidth = "100%";
    const rampHeight: number = 75;

    const rampDiv = document.createElement("div");
    const opacityRampClass = isOpacityRamp ? CSS.opacityRamp : "";
    rampDiv.className = `${CSS.colorRamp} ${opacityRampClass}`;
    rampDiv.style.height = `${rampHeight}px`;

    const surface = createSurface(rampDiv, rampWidth, rampHeight);

    try {
      // TODO: When HeatmapRenderer is supported, stop offsets should not be adjusted.
      // equalIntervalStops will be true for sizeInfo, false for heatmap.
      // Heatmaps tend to have lots of colors, we don't want a giant color ramp.
      // Hence equalIntervalStops = false.

      if (!isHeatmapRamp) {
        // Adjust the stop offsets so that we have stops at fixed/equal interval.
        rampStops.forEach((stop, index) => {
          stop.offset = index / numGradients;
        });
      }

      surface
        .createRect({ x: 0, y: 0, width: rampWidth as any, height: rampHeight })
        .setFill({
          type: "linear",
          x1: 0,
          y1: 0,
          x2: 0,
          y2: rampHeight,
          colors: rampStops
        })
        .setStroke(null);

      if (
        legendElement.type === "color-ramp" ||
        legendElement.type === "opacity-ramp"
      ) {
        const overlayColor = legendElement.overlayColor;

        if (overlayColor && overlayColor.a > 0) {
          surface
            .createRect({
              x: 0,
              y: 0,
              width: rampWidth as any,
              height: rampHeight
            })
            .setFill(overlayColor)
            .setStroke(null);
        }
      }
    } catch (e) {
      surface.clear();
      surface.destroy();
    }

    if (!surface) {
      return null;
    }

    const labelsContent = rampStops
      .filter(stop => !!stop.label)
      .map(stop => (
        <div class={CSS.rampLabel}>
          {isHeatmapRamp ? i18n[stop.label] : stop.label}
        </div>
      ));

    const symbolContainerStyles = { width: `${GRADIENT_WIDTH}px` },
      rampLabelsContainerStyles = { height: `${rampHeight}px` };
    return (
      <div class={this.classes(CSS.layerRow)}>
        <div class={CSS.symbolContainer} styles={symbolContainerStyles}>
          <div
            class={CSS.rampContainer}
            bind={rampDiv}
            afterCreate={attachToNode}
          />
        </div>
        <div class={CSS.layerInfo}>
          <div
            class={CSS.rampLabelsContainer}
            styles={rampLabelsContainerStyles}
          >
            {labelsContent}
          </div>
        </div>
      </div>
    );
  }

  // _renderLegendForElementInfo
  private _renderLegendForElementInfo(
    elementInfo: any,
    layer: Layer,
    isSizeRamp: boolean,
    legendType: string,
    legendInfoIndex: number,
    field: string,
    legendElementIndex: number,
    legendTitle: string,
    legendElement: LegendElement,
    activeLayerInfo: ActiveLayerInfo,
    activeLayerInfoIndex: number,
    featureLayerViewIndex: number,
    legendElementInfos: any[]
  ): VNode {
    // nested
    if (elementInfo.type) {
      return this._renderLegendForElement(
        elementInfo,
        layer,
        legendElementIndex,
        activeLayerInfo,
        activeLayerInfoIndex,
        featureLayerViewIndex,
        legendElementInfos,
        null,
        true
      );
    }

    let content: any = null;
    const isStretched = isImageryStretchedLegend(
      layer as ImageryLayer,
      legendType
    );

    if (elementInfo.symbol && elementInfo.preview) {
      content = (
        <div
          class={CSS.symbol}
          bind={elementInfo.preview}
          afterCreate={attachToNode}
        />
      );
    } else if (elementInfo.src) {
      content = this._renderImage(elementInfo, layer, isStretched);
    }

    if (!content) {
      return null;
    }

    const labelClasses = {
      [CSS.imageryLayerInfoStretched]: isStretched
    };

    const symbolClasses = {
      [CSS.imageryLayerInfoStretched]: isStretched,
      [CSS.sizeRamp]: !isStretched && isSizeRamp
    };

    let selectedRow = null;
    if (this._selectedStyleData.length > 0) {
      const featureLayerData = this._selectedStyleData.find(data =>
        data ? activeLayerInfo.layer.id === data.layerItemId : null
      );
      if (featureLayerData) {
        const selectedInfoIndex = featureLayerData.selectedInfoIndex;
        if (activeLayerInfo.legendElements.length > 1) {
          selectedRow =
            selectedInfoIndex.length > 0 &&
            selectedInfoIndex[legendElementIndex] &&
            selectedInfoIndex[legendElementIndex].indexOf(legendInfoIndex) !==
              -1
              ? this.classes(
                  CSS.layerRow,
                  CSS.filterLayerRow,
                  CSS.selectedRow,
                  CSS.hoverStyles
                )
              : this.classes(CSS.layerRow, CSS.filterLayerRow, CSS.hoverStyles);
        } else {
          selectedRow =
            selectedInfoIndex.indexOf(legendInfoIndex) !== -1
              ? this.classes(
                  CSS.layerRow,
                  CSS.filterLayerRow,
                  CSS.selectedRow,
                  CSS.hoverStyles
                )
              : this.classes(CSS.layerRow, CSS.filterLayerRow, CSS.hoverStyles);
        }
      }
    }

    const hasPictureMarkersAndIsMute = this._checkForPictureMarkersAndIsMute(
      activeLayerInfo
    );
    const isRelationship = legendElement.type === "relationship-ramp";
    const isSizeRampAndMute = isSizeRamp && this.filterMode === "mute";
    const selectedStyleData = this._selectedStyleData.getItemAt(
      featureLayerViewIndex
    );
    const requiredFields = selectedStyleData
      ? selectedStyleData &&
        selectedStyleData.requiredFields &&
        this._selectedStyleData.getItemAt(featureLayerViewIndex).requiredFields
          .length > 0
        ? true
        : false
      : null;

    const hasPictureFillAndIsMute = this._checkForPictureFillAndIsMute(
      activeLayerInfo
    );

    const applySelect =
      ((isRelationship ||
        hasPictureMarkersAndIsMute ||
        isSizeRampAndMute ||
        hasPictureFillAndIsMute ||
        legendTitle === "Predominant") &&
        legendElement.infos.length > 1 &&
        !activeLayerInfo.layer.hasOwnProperty("sublayers")) ||
      !requiredFields
        ? null
        : field && elementInfo.hasOwnProperty("value")
        ? selectedRow
        : null;
    const hasMoreThanOneInfo = legendElement.infos.length > 1;

    const featureLayerData =
      this._selectedStyleData.length > 0
        ? this._selectedStyleData.find(data =>
            data ? activeLayerInfo.layer.id === data.layerItemId : null
          )
        : null;

    return (
      <div
        bind={this}
        class={
          hasMoreThanOneInfo && requiredFields && featureLayerData
            ? applySelect
            : null
        }
        tabIndex={hasMoreThanOneInfo && applySelect ? 0 : null}
        data-legend-index={`${legendElementIndex}`}
        data-child-index={`${legendInfoIndex}`}
        data-layer-id={`${activeLayerInfo.layer.id}`}
        onclick={(event: Event) => {
          if (
            !isRelationship &&
            !hasPictureMarkersAndIsMute &&
            !isSizeRampAndMute &&
            !hasPictureFillAndIsMute &&
            elementInfo.hasOwnProperty("value") &&
            legendElement.title !== "Predominant category" &&
            hasMoreThanOneInfo &&
            !activeLayerInfo.layer.hasOwnProperty("sublayers") &&
            requiredFields &&
            field &&
            featureLayerData
          ) {
            this._handleFilterOption(
              event,
              elementInfo,
              field,
              legendInfoIndex,
              featureLayerViewIndex,
              isSizeRamp,
              legendElement,
              legendElementInfos
            );
          }
        }}
        onkeydown={(event: Event) => {
          if (
            !isRelationship &&
            !hasPictureMarkersAndIsMute &&
            !isSizeRampAndMute &&
            !hasPictureFillAndIsMute &&
            elementInfo.hasOwnProperty("value") &&
            legendElement.title !== "Predominant category" &&
            hasMoreThanOneInfo &&
            !activeLayerInfo.layer.hasOwnProperty("sublayers") &&
            requiredFields &&
            field &&
            featureLayerData
          ) {
            this._handleFilterOption(
              event,
              elementInfo,
              field,
              legendInfoIndex,
              featureLayerViewIndex,
              isSizeRamp,
              legendElement,
              legendElementInfos
            );
          }
        }}
      >
        <div class={this.classes(CSS.symbolContainer, symbolClasses)}>
          {content}
        </div>
        <div class={this.classes(CSS.layerInfo, labelClasses)}>
          {getTitle(elementInfo.label, false) || ""}
        </div>
      </div>
    );
  }

  // _renderImage
  private _renderImage(
    elementInfo: any,
    layer: Layer,
    isStretched: boolean
  ): VNode {
    const { label, src, opacity } = elementInfo;

    const stretchedClasses = {
      [CSS.imageryLayerStretchedImage]: isStretched,
      [CSS.symbol]: !isStretched
    };

    const dynamicStyles = {
      opacity: `${opacity != null ? opacity : layer.opacity}`
    };

    return (
      <img
        alt={label}
        src={src}
        border={0}
        width={elementInfo.width}
        height={elementInfo.height}
        class={this.classes(stretchedClasses)}
        styles={dynamicStyles}
      />
    );
  }

  //-------------------------------------------------------------------
  //
  //  Filter methods
  //
  //-------------------------------------------------------------------

  @accessibleHandler()
  private _handleFilterOption(
    event: Event,
    elementInfo: any,
    field: string,
    legendInfoIndex: number,
    featureLayerViewIndex: number,
    isSizeRamp: boolean,
    legendElement: LegendElement,
    legendElementInfos?: any[]
  ): void {
    this.filterMode === "highlight"
      ? this._featureHighlight(
          event,
          elementInfo,
          field,
          legendInfoIndex,
          featureLayerViewIndex,
          isSizeRamp,
          legendElement,
          legendElementInfos
        )
      : this.filterMode === "featureFilter"
      ? this._featureFilter(
          elementInfo,
          field,
          featureLayerViewIndex,
          legendInfoIndex,
          legendElement,
          legendElementInfos
        )
      : this.filterMode === "mute"
      ? this._featureMute(
          event,
          elementInfo,
          field,
          legendInfoIndex,
          featureLayerViewIndex,
          legendElement,
          legendElementInfos
        )
      : null;
  }

  //_filterFeatures
  private _featureFilter(
    elementInfo: any,
    field: string,
    featureLayerViewIndex: number,
    legendInfoIndex: number,
    legendElement: LegendElement,
    legendElementInfos?: any[]
  ): void {
    this._handleSelectedStyles(event);
    this.viewModel.applyFeatureFilter(
      elementInfo,
      field,
      featureLayerViewIndex,
      legendElement,
      legendInfoIndex,
      legendElementInfos
    );
  }

  // _highlightFeatures
  private _featureHighlight(
    event: Event,
    elementInfo: any,
    field: string,
    legendInfoIndex: number,
    featureLayerViewIndex: number,
    isSizeRamp: boolean,
    legendElement: LegendElement,
    legendElementInfos: any[]
  ): void {
    const { state } = this.viewModel;
    if (state === "querying") {
      return;
    }

    this.viewModel.applyFeatureHighlight(
      elementInfo,
      field,
      legendInfoIndex,
      featureLayerViewIndex,
      isSizeRamp,
      legendElement,
      legendElementInfos
    );
    this._handleSelectedStyles(event, featureLayerViewIndex, legendInfoIndex);
  }

  // _muteFeatures
  private _featureMute(
    event: Event,
    elementInfo: any,
    field: string,
    legendInfoIndex: number,
    featureLayerViewIndex: number,
    legendElement: LegendElement,
    legendElementInfos: any[]
  ): void {
    this._handleSelectedStyles(event);
    this.viewModel.applyFeatureMute(
      elementInfo,
      field,
      legendInfoIndex,
      featureLayerViewIndex,
      legendElement,
      legendElementInfos
    );
  }
  // End of filter methods

  // _handleSelectedStyles
  private _handleSelectedStyles(
    event: Event,
    featureLayerViewIndex?: number,
    legendInfoIndex?: number
  ): void {
    const node = event.currentTarget as HTMLElement;
    const legendElementInfoIndex = parseInt(
      node.getAttribute("data-child-index")
    );
    const legendElementIndex = parseInt(node.getAttribute("data-legend-index"));
    const activeLayerInfoId = node.getAttribute("data-layer-id");
    const featureLayerData = this._selectedStyleData.find(
      layerData => layerData.layerItemId === activeLayerInfoId
    );
    const { selectedInfoIndex } = featureLayerData;
    const legendElementInfoIndexFromData = selectedInfoIndex.indexOf(
      legendElementInfoIndex
    );
    const activeLayerInfo = this.activeLayerInfos.find(
      activeLayerInfo =>
        activeLayerInfo.layer.id === featureLayerData.layerItemId
    );
    const legendElementChildArr =
      featureLayerData.selectedInfoIndex[legendElementIndex];

    if (this.filterMode === "highlight") {
      const highlightedFeatures = this.viewModel.interactiveStyleData
        .highlightedFeatures[featureLayerViewIndex];
      if (
        !highlightedFeatures[legendInfoIndex] &&
        !featureLayerData.selectedInfoIndex[legendElementIndex] &&
        featureLayerData.selectedInfoIndex.indexOf(legendInfoIndex) === -1
      ) {
        return;
      }
    }

    if (activeLayerInfo.legendElements.length === 1) {
      legendElementInfoIndexFromData === -1
        ? selectedInfoIndex.push(legendElementInfoIndex)
        : selectedInfoIndex.splice(legendElementInfoIndexFromData, 1);
    } else if (activeLayerInfo.legendElements.length > 1) {
      if (
        Array.isArray(legendElementChildArr) &&
        legendElementChildArr.length >= 1
      ) {
        legendElementChildArr.indexOf(legendElementInfoIndex) === -1
          ? legendElementChildArr.push(legendElementInfoIndex)
          : legendElementChildArr.splice(
              legendElementChildArr.indexOf(legendElementInfoIndex),
              1
            );
      } else {
        featureLayerData.selectedInfoIndex[legendElementIndex] = [
          legendElementInfoIndex
        ];
      }
    }
  }

  // _getFeatureLayerViewIndex
  private _getFeatureLayerViewIndex(activeLayerInfo: ActiveLayerInfo): number {
    let itemIndex = null;
    this.viewModel.featureLayerViews.forEach(
      (featureLayerView, featureLayerViewIndex) => {
        if (featureLayerView) {
          const featureLayerViewSourceLayer = featureLayerView.layer as any;
          if (featureLayerViewSourceLayer.uid === activeLayerInfo.layer.uid) {
            itemIndex = featureLayerViewIndex;
          }
        }
      }
    );
    return itemIndex;
  }

  // _checkForPictureMarkersAndIsMute
  private _checkForPictureMarkersAndIsMute(
    activeLayerInfo: ActiveLayerInfo
  ): boolean {
    const { layer } = activeLayerInfo;
    const hasRenderer = layer.hasOwnProperty("renderer");
    if (!hasRenderer) {
      return false;
    }
    const { renderer } = layer;
    const hasSymbol = renderer.hasOwnProperty("symbol");
    const hasUniqueValueInfos = renderer.hasOwnProperty("uniqueValueInfos");
    const hasClassBreakInfos = renderer.hasOwnProperty("classBreakInfos");
    return (
      ((hasRenderer &&
        hasSymbol &&
        renderer.symbol.type === "picture-marker") ||
        (hasRenderer &&
          hasUniqueValueInfos &&
          renderer.uniqueValueInfos.every(
            (uvInfo: __esri.UniqueValueInfo) =>
              uvInfo.symbol.type === "picture-marker"
          )) ||
        (hasRenderer &&
          hasClassBreakInfos &&
          renderer.classBreakInfos.every(
            (cbInfo: __esri.ClassBreaksRendererClassBreakInfos) =>
              cbInfo.symbol.type === "picture-marker"
          ))) &&
      this.filterMode === "mute"
    );
  }

  // _checkForPictureFillAndIsMute
  private _checkForPictureFillAndIsMute(
    activeLayerInfo: ActiveLayerInfo
  ): boolean {
    const { layer } = activeLayerInfo;
    const hasRenderer = layer.hasOwnProperty("renderer");
    if (!hasRenderer) {
      return false;
    }
    const { renderer } = layer;
    const hasSymbol = renderer.hasOwnProperty("symbol");
    const hasUniqueValueInfos = renderer.hasOwnProperty("uniqueValueInfos");
    const hasClassBreakInfos = renderer.hasOwnProperty("classBreakInfos");
    return (
      ((hasRenderer && hasSymbol && renderer.symbol.type === "picture-fill") ||
        (hasRenderer &&
          hasUniqueValueInfos &&
          renderer.uniqueValueInfos.every(
            (uvInfo: __esri.UniqueValueInfo) =>
              uvInfo.symbol.type === "picture-fill"
          )) ||
        (hasRenderer &&
          hasClassBreakInfos &&
          renderer.classBreakInfos.every(
            (cbInfo: __esri.ClassBreaksRendererClassBreakInfos) =>
              cbInfo.symbol.type === "picture-fill"
          ))) &&
      this.filterMode === "mute"
    );
  }
}

export = InteractiveClassic;
