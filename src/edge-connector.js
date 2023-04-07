import { uuid } from "@jsplumb/util"
import { EVENT_EDGE_REMOVED } from "@jsplumbtoolkit/core"

/**
 * This is an experiment and may or may not be production ready!  Use at your own risk.
 *
 * There are a few issues that would need to be resolved in order to
 * use this in production, including, but not limited to:
 *
 * - the edge type to use is hardcoded
 * - the dummy node type to use is hardcoded
 * - there is no cleanup if an edge created with this object is removed from the dataset
 * - there is no integration with the model - meaning there is no abstraction of what this class does that would allow
 * you to export what has been created, or to reinstate a set of edges to edges.
 */
export class EdgeConnector {

    /**
     * map of edge ids to internal entries
     * @type {{}}
     */
    edgeMap = {}

    /**
     * a map of connections that we have created.
     * @type {Array}
     */
    createdConnections = {}

    surface
    toolkit
    renderer

    placeholderNodeSize = {w:10, h:10}

    constructor(surface) {
        this.surface = surface
        this.toolkit = surface.toolkitInstance
        this.renderer = surface.jsplumb

        this.toolkit.bind(EVENT_EDGE_REMOVED, (p) => {
            const entry = this.edgeMap[p.edge.id]
            if (entry != null) {
                for(let i = 0; i < entry.targetNodes.length; i++) {
                    this.toolkit.removeNode(entry.targetNodes[i].node)
                }
            }

            // if we created this edge, we will now remove the dummy node we made as its target
            if(this.createdConnections[p.edge.id] != null) {
                requestAnimationFrame(() => {
                    this.toolkit.removeNode(p.edge.target)
                })
            }

        })
    }

    /**
     * calculate the position for a dummy node on the given edge at the given location on the edge.
     * @param connector
     * @param locationOnEdge This is a proportional value: 0 means at the start, 1 means at the end.
     * @return {{top: number, left: number}}
     * @private
     */
    _computePosition(connector, locationOnEdge) {
        const pointOnEdge = connector.pointOnPath(locationOnEdge)
        return {
            left:pointOnEdge.x + connector.x - (this.placeholderNodeSize.w / 2),
            top:pointOnEdge.y + connector.y - (this.placeholderNodeSize.h / 2)
        }
    }

    /**
     * Register the given edge - we create an entry for it in our map, storing the edge, connection and connector,
     * as well as the connector's original `compute` method, which we then override (see code below).
     * For each edge we also store a list of nodes that represent locations on the edge to which other edges are attached.
     * @param edge
     * @return {*}
     * @private
     */
    _registerEdge(edge) {

        const connection = this.surface.getRenderedConnection(edge.id)

        let entry = this.edgeMap[edge.id]
        const connector = connection.connector
        const compute = connector.compute
        if (entry == null) {
            entry = {
                compute,
                connector,
                connection,
                edge,
                targetNodes:[]
            }

            this.edgeMap[edge.id] = entry

            // override the compute method.
            connector.compute = function() {
                // we invoke the original method on the connector
                compute.apply(connector, arguments)
                // then we recompute where all our dummy nodes are, and redraw them.
                for(let i = 0; i < entry.targetNodes.length; i++) {
                    const target = entry.targetNodes[i]
                    const newPosition = this._computePosition(connector, target.locationOnEdge)
                    // in a timeout, so as to avoid getting into an infinite loop, position our dummy node,
                    // which will draw the edge to it.
                    requestAnimationFrame(() => {
                        this.surface.setPosition(target.node, newPosition.left, newPosition.top)
                    })
                }
            }.bind(this)
        }

        return entry

    }

    /**
     * add an edge from some source vertex to a target edge.
     * @param sourceVertex
     * @param targetEdge
     * @param locationOnEdge
     * @private
     */
    _addEdge(sourceVertex, targetEdge, locationOnEdge) {

        const entry = this._registerEdge(targetEdge)

        if (entry) {
            const newPosition = this._computePosition(entry.connector, locationOnEdge)

            // create a dummy node and give it an initial position.
            const node = this.toolkit.addNode({
                id:uuid(),
                type:"placeholder",
                left:newPosition.left,
                top:newPosition.top
            })

            // join the dummy node to the source vertex. note here we provide an edge type; it's not strictly
            // required, i did it for this demo to call this edge out.
            const edge = this.toolkit.addEdge({source:sourceVertex.id, target:node, data:{type:"exampleAlternate"}})

            // store this so that if the edge is subsequently removed we will remove its target node (a dummy node
            // we created)
            this.createdConnections[edge.id] = edge

            entry.targetNodes.push({
                locationOnEdge,
                node,
                sourceVertex,
                edge
            })
        }


    }

    /**
     * Create an edge that connects from some vertex to an edge, anchored
     * at a specific position on the target edge (which defaults to 0.5)
     *
     * Internally this code creates a blank vertex
     *
     * @param sourceVertexId
     * @param edgeId
     * @param locationOnEdge
     */
    connectToEdge(sourceVertexId, edgeId, locationOnEdge) {

        locationOnEdge = locationOnEdge == null ? 0.5 : locationOnEdge

        const edge = this.toolkit.getEdge(edgeId)
        if (edge != null) {
            const vertex = this.toolkit.getVertex(sourceVertexId)
            if (vertex != null) {

                this._addEdge(vertex, edge, locationOnEdge)

            } else {
                // eslint-disable-next-line
                console.log(`Cannot find vertex with id ${sourceVertexId}`)
            }

        } else {
            // eslint-disable-next-line
            console.log(`Cannot find edge with id ${edgeId}`)
        }


    }
}



