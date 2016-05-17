// From http://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
}


function Tile(x, y) {
    this.x = x, this.y = y;
    this.hidden = true;
    this.flagged = false;
    this.value = null;
}

Tile.prototype.getSrc = function() {
    return 'images/' + (this.hidden ? (this.flagged ? 'bombflagged' : 'blank')
                                    : this.value) + '.gif';
}

/**
 * @param mineCount - The number of mines to hide.
 */
function Board(width, height, mineCount) {
    this.width = width;
    this.height = height;
    this.mineCount = mineCount;
    this.mines = null;
    this.flags = [];
    this.revealed = 0;
    this.face = 'facesmile';
    this.clickable = true;

    this.tiles = _.map(new Array(height * width), function(val, i) {
        return new Tile(i % width, Math.floor(i / width));
    });

    this.rows = _.map(new Array(height), function(val, i) {
        return this.tiles.slice(i * width, (i + 1) * width);
    }, this);
};

Board.prototype.pressTile = function() {
    if (this.clickable) {
        this.face = 'faceooh';
    }
}

Board.prototype.clickTile = function(evt, tile) {
    if (!this.clickable) {
        return;
    }
    this.face = 'facesmile';
    if (evt.which === 3 && tile.hidden) {
        tile.flagged = !tile.flagged;
        if (tile.flagged) {
            this.flags.push(tile);
        } else {
            this.flags = _.without(this.flags, tile);
        }
    } else if (!tile.flagged && tile.hidden) {
        if (this.revealed == 0) {
            this.initValues(tile);
        }
        this.revealed += 1;
        if (this.revealed === (this.width * this.height) - this.mineCount) {
            this.face = 'facewin';
            this.clickable = false;
        }

        tile.hidden = false;
        tile.value = (_.contains(this.mines, tile) ? 'bombdeath' : 'open' +
            _.filter(this.getAdjacentTiles(tile.x, tile.y), function(adjTile) {
                return _.contains(this.mines, adjTile);
            }, this).length);
        if (tile.value == 'bombdeath') {
            this.face = 'facedead';
            this.clickable = false;
            _.each(this.mines, function(mineTile) {
                if (mineTile !== tile) {
                    mineTile.value = 'bombrevealed';
                }
                mineTile.hidden = false;
            });
            _.each(this.flags, function(flagTile) {
                if (!_.contains(this.mines, flagTile)) {
                    flagTile.value = 'bombmisflagged';
                }
                flagTile.hidden = false;
            });
        } else if (tile.value === 'open0') {
            _.each(this.getAdjacentTiles(tile.x, tile.y), function(adjTile) {
                this.clickTile(evt, adjTile, adjTile);
            }, this);
        }
    }
};

Board.prototype.getAdjacentTiles = function (x, y) {
    var tiles = [];
    _.each([-1, 0, 1], function(dx) {
        _.each([-1, 0, 1], function(dy) {
            if (y + dy >= 0 && y + dy < this.height &&
                x + dx >= 0 && x + dx < this.width &&
                !(dy === 0 && dx === 0)) {
                tiles.push(this.rows[y + dy][x + dx]);
            };
        }, this);
    }, this);
    return tiles;
};

Board.prototype.initValues = function (tile) {
    var inelgibleTiles = this.getAdjacentTiles(tile.x, tile.y);
    inelgibleTiles.push(tile);
    this.mines = getRandom(this.tiles.filter(function(tile) {
        return !(inelgibleTiles.indexOf(tile) >= 0);
    }), this.mineCount);
}

angular.module('minesweeper', [])
.controller('MinesweeperController', ['$interval', '$scope', function($interval, $scope) {
    $scope.newGame = function() {
        $scope.timeTaken = 0;
        $scope.board = new Board(8, 8, 10);
    };
    $scope.newGame();
    $interval(function() {
        if ($scope.board.mines && $scope.board.clickable) {
            $scope.timeTaken += 1;
        }
    }, 1000);
}])
.directive('number', [function() {
    return {
        controller: ['$scope', function($scope) {
            $scope.$watch('value', function(value) {
                $scope.digits = [
                    Math.floor(Math.abs(value) % 1000 / 100),
                    Math.floor(Math.abs(value) % 100 / 10),
                    Math.abs(value) % 10
                ];
                if (value < 0) {
                    $scope.digits[0] = '-';
                }
            });
        }],
        restrict: 'E',
        scope: {
            value: '='
        },
        templateUrl: 'number.html'
    };
}]);
